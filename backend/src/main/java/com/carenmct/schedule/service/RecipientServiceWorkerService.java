package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Employee;
import com.carenmct.schedule.domain.com.RecipientFamilyWorker;
import com.carenmct.schedule.domain.schedule.RecipientServiceWorker;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.scheduleassignment.RecipientFamilyWorkerDto;
import com.carenmct.schedule.dto.scheduleassignment.RecipientServiceWorkerItemDto;
import com.carenmct.schedule.dto.scheduleassignment.RecipientServiceWorkersResponse;
import com.carenmct.schedule.dto.scheduleassignment.ReplaceRecipientServiceWorkersRequest;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.com.ComRecipientFamilyWorkerRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.RecipientServiceWorkerRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RecipientServiceWorkerService {

    private final RecipientServiceWorkerRepository workerRepository;
    private final ComRecipientRepository recipientRepository;
    private final ComEmployeeRepository employeeRepository;
    private final ComRecipientFamilyWorkerRepository familyWorkerRepository;
    private final FacilityScopeResolver facilityScope;

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public RecipientServiceWorkersResponse list(String recipientId) {
        long recipientLongId = parseRecipientId(recipientId);
        requireRecipient(recipientLongId);
        List<RecipientServiceWorkerItemDto> items = workerRepository
                .findByRecipientIdOrderByServiceTypeAscSortOrderAsc(recipientLongId)
                .stream()
                .map(this::toDto)
                .toList();
        return new RecipientServiceWorkersResponse(items);
    }

    /** 통합관리 `recipient_family_workers` — 가족요양 자동선택용 */
    @Transactional(readOnly = true, transactionManager = "comTransactionManager")
    public List<RecipientFamilyWorkerDto> listFamilyWorkers(String recipientId) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseRecipientId(recipientId);
        recipientRepository
                .findByIdAndFacility_Id(recipientLongId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        List<RecipientFamilyWorker> rows =
                familyWorkerRepository.findByRecipientIdOrderBySelfCopayDeductionDescIdAsc(recipientLongId);
        if (rows.isEmpty()) {
            return List.of();
        }

        Set<Long> empIds = rows.stream()
                .map(RecipientFamilyWorker::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> names = new HashMap<>();
        if (!empIds.isEmpty()) {
            for (Employee e :
                    employeeRepository.findByIdInAndFacility_IdAndDeletedAtIsNull(empIds, facilityId)) {
                names.put(e.getId(), e.getName());
            }
        }

        return rows.stream()
                .filter(r -> names.containsKey(r.getEmployeeId()))
                .map(r -> new RecipientFamilyWorkerDto(
                        String.valueOf(r.getEmployeeId()),
                        names.get(r.getEmployeeId()),
                        r.getFamilyRelation(),
                        Boolean.TRUE.equals(r.getSelfCopayDeduction())))
                .toList();
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public RecipientServiceWorkersResponse replace(
            String recipientId, ReplaceRecipientServiceWorkersRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseRecipientId(recipientId);
        requireRecipient(recipientLongId);

        List<RecipientServiceWorkerItemDto> incoming =
                request.items() != null ? request.items() : List.of();
        validateItems(facilityId, incoming);

        workerRepository.deleteByRecipientId(recipientLongId);
        workerRepository.flush();

        List<RecipientServiceWorker> saved = new ArrayList<>();
        int index = 0;
        Set<String> seen = new HashSet<>();
        for (RecipientServiceWorkerItemDto item : incoming) {
            if (item.serviceType() == null || item.employeeId() == null) {
                continue;
            }
            String key = item.serviceType() + "|" + item.employeeId();
            if (!seen.add(key)) {
                continue;
            }
            int sortOrder = item.sortOrder() > 0 ? item.sortOrder() : index;
            String familyRelation =
                    item.serviceType() == ServiceType.family_care && StringUtils.hasText(item.familyRelation())
                            ? item.familyRelation().trim()
                            : null;
            saved.add(workerRepository.save(RecipientServiceWorker.create(
                    recipientLongId,
                    item.serviceType(),
                    item.employeeId(),
                    familyRelation,
                    sortOrder)));
            index++;
        }

        List<RecipientServiceWorkerItemDto> items = saved.stream().map(this::toDto).toList();
        return new RecipientServiceWorkersResponse(items);
    }

    private void validateItems(String facilityId, List<RecipientServiceWorkerItemDto> items) {
        for (RecipientServiceWorkerItemDto item : items) {
            if (item.serviceType() == null || item.employeeId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "serviceType and employeeId are required");
            }
            employeeRepository
                    .findByIdInAndFacility_IdAndDeletedAtIsNull(List.of(item.employeeId()), facilityId)
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Employee not found: " + item.employeeId()));
            if (item.serviceType() == ServiceType.family_care
                    && !StringUtils.hasText(item.familyRelation())) {
                // allow empty on save of list — UI normally requires it before assign
            }
        }
    }

    private void requireRecipient(long recipientId) {
        String facilityId = facilityScope.requireFacilityId();
        recipientRepository
                .findByIdAndFacility_Id(recipientId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
    }

    private RecipientServiceWorkerItemDto toDto(RecipientServiceWorker row) {
        return new RecipientServiceWorkerItemDto(
                row.getServiceType(),
                row.getEmployeeId(),
                row.getFamilyRelation(),
                row.getSortOrder() != null ? row.getSortOrder() : 0);
    }

    private static long parseRecipientId(String recipientId) {
        try {
            return Long.parseLong(recipientId);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid recipientId");
        }
    }
}
