package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Employee;
import com.carenmct.schedule.domain.com.QRecipient;
import com.carenmct.schedule.domain.com.QRecipientService;
import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.AssessmentDocument;
import com.carenmct.schedule.domain.schedule.enums.AssessmentDocType;
import com.carenmct.schedule.dto.careplan.AssessmentDocumentDetailDto;
import com.carenmct.schedule.dto.careplan.AssessmentDocumentSummaryDto;
import com.carenmct.schedule.dto.careplan.CarePlanRecipientDto;
import com.carenmct.schedule.dto.careplan.CreateAssessmentDocumentRequest;
import com.carenmct.schedule.dto.careplan.UpdateAssessmentDocumentRequest;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.AssessmentDocumentRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.security.UserScope;
import com.carenmct.schedule.support.RecipientGroupFilterSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CarePlanService {

    private final FacilityScopeResolver facilityScope;
    private final ComRecipientRepository comRecipientRepository;
    private final ComEmployeeRepository comEmployeeRepository;
    private final AssessmentDocumentRepository assessmentDocumentRepository;
    private final RecipientGroupFilterSupport groupFilterSupport;
    private final ObjectMapper objectMapper;
    private final JPAQueryFactory comQueryFactory;

    public CarePlanService(
            FacilityScopeResolver facilityScope,
            ComRecipientRepository comRecipientRepository,
            ComEmployeeRepository comEmployeeRepository,
            AssessmentDocumentRepository assessmentDocumentRepository,
            RecipientGroupFilterSupport groupFilterSupport,
            ObjectMapper objectMapper,
            @Qualifier("comJpaQueryFactory") JPAQueryFactory comQueryFactory) {
        this.facilityScope = facilityScope;
        this.comRecipientRepository = comRecipientRepository;
        this.comEmployeeRepository = comEmployeeRepository;
        this.assessmentDocumentRepository = assessmentDocumentRepository;
        this.groupFilterSupport = groupFilterSupport;
        this.objectMapper = objectMapper;
        this.comQueryFactory = comQueryFactory;
    }

    @Transactional(readOnly = true, transactionManager = "comTransactionManager")
    public List<CarePlanRecipientDto> listRecipients(
            String query, Boolean activeOnly, String groupId, String subgroupId) {
        String facilityId = facilityScope.requireFacilityId();
        List<Recipient> recipients = comRecipientRepository.findByFacilityId(facilityId, query);
        Map<Long, List<String>> serviceTypesByRecipient = loadServiceTypes(facilityId);
        Map<Long, Map<String, String>> latestByRecipient = loadLatestDates(facilityId);
        Set<Long> groupRecipientIds = groupFilterSupport.resolveRecipientIds(groupId, subgroupId);

        boolean onlyActive = activeOnly == null || activeOnly;
        return recipients.stream()
                .filter(r -> !onlyActive || "수급중".equals(r.getContractStatus()))
                .filter(r -> groupFilterSupport.matchesRecipient(String.valueOf(r.getId()), groupRecipientIds))
                .map(r -> toRecipientDto(
                        r,
                        serviceTypesByRecipient.getOrDefault(r.getId(), List.of()),
                        latestByRecipient.getOrDefault(r.getId(), Map.of())))
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<AssessmentDocumentSummaryDto> listDocuments(String recipientId, AssessmentDocType docType) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseLongId(recipientId, "recipientId");
        requireRecipient(facilityId, recipientLongId);

        return assessmentDocumentRepository
                .findByFacilityIdAndRecipientIdAndDocTypeAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
                        facilityId, recipientLongId, docType)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public AssessmentDocumentDetailDto getDocument(Long id) {
        String facilityId = facilityScope.requireFacilityId();
        AssessmentDocument doc = requireDocument(facilityId, id);
        return toDetail(doc);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public AssessmentDocumentDetailDto create(CreateAssessmentDocumentRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        if (request.docType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "docType is required");
        }
        if (request.formData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData is required");
        }
        long recipientLongId = parseLongId(request.recipientId(), "recipientId");
        requireRecipient(facilityId, recipientLongId);
        LocalDate writtenDate = parseDate(request.writtenDate(), "writtenDate");
        Long employeeId = resolveEmployeeId(facilityId, request.employeeId());
        Long userId = UserScope.currentUserIdOrNull();

        AssessmentDocument doc = AssessmentDocument.create(
                facilityId,
                recipientLongId,
                request.docType(),
                writtenDate,
                userId,
                employeeId,
                toJson(request.formData()),
                userId);
        return toDetail(assessmentDocumentRepository.save(doc));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public AssessmentDocumentDetailDto update(Long id, UpdateAssessmentDocumentRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        AssessmentDocument doc = requireDocument(facilityId, id);
        if (request.formData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData is required");
        }
        LocalDate writtenDate = parseDate(request.writtenDate(), "writtenDate");
        Long employeeId = resolveEmployeeId(facilityId, request.employeeId());
        Long userId = UserScope.currentUserIdOrNull();
        doc.update(writtenDate, employeeId, toJson(request.formData()), userId);
        return toDetail(doc);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public void delete(Long id) {
        String facilityId = facilityScope.requireFacilityId();
        AssessmentDocument doc = requireDocument(facilityId, id);
        doc.softDelete(UserScope.currentUserIdOrNull());
    }

    private Map<Long, Map<String, String>> loadLatestDates(String facilityId) {
        Map<Long, Map<String, String>> result = new HashMap<>();
        for (Object[] row : assessmentDocumentRepository.findLatestWrittenDatesByFacility(facilityId)) {
            Long recipientId = (Long) row[0];
            AssessmentDocType docType = (AssessmentDocType) row[1];
            LocalDate writtenDate = (LocalDate) row[2];
            result.computeIfAbsent(recipientId, ignored -> new LinkedHashMap<>())
                    .put(docType.name(), writtenDate.toString());
        }
        return result;
    }

    private Map<Long, List<String>> loadServiceTypes(String facilityId) {
        QRecipient recipient = QRecipient.recipient;
        QRecipientService service = QRecipientService.recipientService;
        List<Tuple> rows = comQueryFactory
                .select(service.recipient.id, service.serviceType)
                .from(service)
                .join(service.recipient, recipient)
                .where(recipient.facility.id.eq(facilityId))
                .fetch();
        Map<Long, List<String>> result = new HashMap<>();
        for (Tuple row : rows) {
            Long recipientId = row.get(service.recipient.id);
            String serviceType = row.get(service.serviceType);
            if (recipientId == null || !StringUtils.hasText(serviceType)) {
                continue;
            }
            result.computeIfAbsent(recipientId, ignored -> new ArrayList<>());
            List<String> list = result.get(recipientId);
            if (!list.contains(serviceType)) {
                list.add(serviceType);
            }
        }
        return result;
    }

    private CarePlanRecipientDto toRecipientDto(
            Recipient r, List<String> serviceTypes, Map<String, String> latestDates) {
        return new CarePlanRecipientDto(
                String.valueOf(r.getId()),
                r.getName(),
                r.getLegalDob() != null ? r.getLegalDob().toString() : null,
                r.getRealDob() != null ? r.getRealDob().toString() : null,
                r.getGrade(),
                r.getReduction(),
                r.getCertNo() != null ? r.getCertNo() : "",
                r.getContractStatus(),
                r.getValidFrom() != null ? r.getValidFrom().toString() : null,
                r.getValidTo() != null ? r.getValidTo().toString() : null,
                r.getMobile(),
                r.getApprovedAmtCare(),
                r.getApprovedAmtBath(),
                r.getApprovedAmtNursing(),
                r.getApprovedAmtDay(),
                r.getApprovedAmtOther(),
                serviceTypes,
                latestDates);
    }

    private AssessmentDocumentSummaryDto toSummary(AssessmentDocument doc) {
        return new AssessmentDocumentSummaryDto(
                doc.getId(),
                String.valueOf(doc.getRecipientId()),
                doc.getDocType().name(),
                doc.getWrittenDate().toString(),
                doc.getEmployeeId(),
                resolveAuthorName(doc),
                doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : null,
                doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null);
    }

    private AssessmentDocumentDetailDto toDetail(AssessmentDocument doc) {
        return new AssessmentDocumentDetailDto(
                doc.getId(),
                String.valueOf(doc.getRecipientId()),
                doc.getDocType().name(),
                doc.getWrittenDate().toString(),
                doc.getEmployeeId(),
                resolveAuthorName(doc),
                fromJson(doc.getFormData()),
                doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : null,
                doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : null);
    }

    private String resolveAuthorName(AssessmentDocument doc) {
        if (doc.getEmployeeId() == null) {
            return null;
        }
        return comEmployeeRepository
                .findById(doc.getEmployeeId())
                .map(Employee::getName)
                .orElse(null);
    }

    private Long resolveEmployeeId(String facilityId, Long employeeId) {
        if (employeeId == null) {
            return null;
        }
        Employee employee = comEmployeeRepository
                .findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee not found"));
        if (employee.getDeletedAt() != null || !facilityId.equals(employee.getFacility().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee not found");
        }
        return employeeId;
    }

    private Recipient requireRecipient(String facilityId, long recipientId) {
        return comRecipientRepository
                .findByIdAndFacility_Id(recipientId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
    }

    private AssessmentDocument requireDocument(String facilityId, Long id) {
        return assessmentDocumentRepository
                .findByIdAndFacilityIdAndDeletedAtIsNull(id, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    }

    private static long parseLongId(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException | NullPointerException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
    }

    private static LocalDate parseDate(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
    }

    private String toJson(Map<String, Object> formData) {
        try {
            return objectMapper.writeValueAsString(formData);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid formData");
        }
    }

    private Map<String, Object> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            return Map.of();
        }
    }
}
