package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Employee;
import com.carenmct.schedule.domain.com.QRecipient;
import com.carenmct.schedule.domain.com.QRecipientService;
import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.com.RecipientGuardian;
import com.carenmct.schedule.domain.schedule.ConsultationVisit;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.WorkJournal;
import com.carenmct.schedule.domain.schedule.enums.ConsultStatus;
import com.carenmct.schedule.domain.schedule.enums.ConsultType;
import com.carenmct.schedule.domain.schedule.enums.JournalStatus;
import com.carenmct.schedule.dto.consultation.ConsultWorkerDto;
import com.carenmct.schedule.dto.consultation.ConsultationRecipientDto;
import com.carenmct.schedule.dto.consultation.ConsultationVisitDto;
import com.carenmct.schedule.dto.consultation.CreateConsultationVisitRequest;
import com.carenmct.schedule.dto.consultation.CreateWorkJournalRequest;
import com.carenmct.schedule.dto.consultation.RecipientScheduleItemDto;
import com.carenmct.schedule.dto.consultation.UpdateConsultationVisitRequest;
import com.carenmct.schedule.dto.consultation.UpdateWorkJournalRequest;
import com.carenmct.schedule.dto.consultation.WorkJournalDetailDto;
import com.carenmct.schedule.dto.consultation.WorkJournalSummaryDto;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.com.ComRecipientGuardianRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ConsultationVisitRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.repository.schedule.WorkJournalRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.security.UserScope;
import com.carenmct.schedule.support.EmployeePositionSupport;
import com.carenmct.schedule.support.RecipientGroupFilterSupport;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ConsultationService {

    /** 피그마 CONSULT_WORKER_POSITIONS */
    private static final Set<String> CONSULT_POSITIONS =
            Set.of("ST_01", "ST_03", "ST_04", "ST_09");

    private final FacilityScopeResolver facilityScope;
    private final ComEmployeeRepository comEmployeeRepository;
    private final ComRecipientRepository comRecipientRepository;
    private final ComRecipientGuardianRepository comRecipientGuardianRepository;
    private final ConsultationVisitRepository consultationVisitRepository;
    private final WorkJournalRepository workJournalRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final RecipientGroupFilterSupport groupFilterSupport;
    private final ObjectMapper objectMapper;
    private final JPAQueryFactory comQueryFactory;

    public ConsultationService(
            FacilityScopeResolver facilityScope,
            ComEmployeeRepository comEmployeeRepository,
            ComRecipientRepository comRecipientRepository,
            ComRecipientGuardianRepository comRecipientGuardianRepository,
            ConsultationVisitRepository consultationVisitRepository,
            WorkJournalRepository workJournalRepository,
            ServiceScheduleRepository serviceScheduleRepository,
            RecipientGroupFilterSupport groupFilterSupport,
            ObjectMapper objectMapper,
            @Qualifier("comJpaQueryFactory") JPAQueryFactory comQueryFactory) {
        this.facilityScope = facilityScope;
        this.comEmployeeRepository = comEmployeeRepository;
        this.comRecipientRepository = comRecipientRepository;
        this.comRecipientGuardianRepository = comRecipientGuardianRepository;
        this.consultationVisitRepository = consultationVisitRepository;
        this.workJournalRepository = workJournalRepository;
        this.serviceScheduleRepository = serviceScheduleRepository;
        this.groupFilterSupport = groupFilterSupport;
        this.objectMapper = objectMapper;
        this.comQueryFactory = comQueryFactory;
    }

    @Transactional(readOnly = true, transactionManager = "comTransactionManager")
    public List<ConsultWorkerDto> listWorkers(String statusFilter) {
        String facilityId = facilityScope.requireFacilityId();
        return comEmployeeRepository.findByFacility_IdAndDeletedAtIsNullOrderByNameAsc(facilityId).stream()
                .filter(e -> {
                    String code = EmployeePositionSupport.normalizePositionCode(e.getPosition());
                    return code != null && CONSULT_POSITIONS.contains(code);
                })
                .filter(e -> {
                    if (!StringUtils.hasText(statusFilter) || "all".equals(statusFilter)) {
                        return true;
                    }
                    if ("active".equals(statusFilter)) {
                        return "근무중".equals(e.getStatus()) || "active".equalsIgnoreCase(e.getStatus());
                    }
                    return true;
                })
                .map(e -> {
                    String code = EmployeePositionSupport.normalizePositionCode(e.getPosition());
                    return new ConsultWorkerDto(
                            String.valueOf(e.getId()),
                            e.getName(),
                            code != null ? code : e.getPosition(),
                            e.getStatus(),
                            e.getMobile());
                })
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<ConsultationVisitDto> listVisits(
            int year, int month, String employeeId, String recipientId) {
        String facilityId = facilityScope.requireFacilityId();
        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        boolean filterEmployee = StringUtils.hasText(employeeId) && !"__ALL__".equals(employeeId);
        boolean filterRecipient = StringUtils.hasText(recipientId);
        Long empId = filterEmployee ? parseLongId(employeeId, "employeeId") : null;
        Long recipId = filterRecipient ? parseLongId(recipientId, "recipientId") : null;

        List<ConsultationVisit> visits;
        if (filterEmployee && filterRecipient) {
            visits = consultationVisitRepository
                    .findByFacilityIdAndEmployeeIdAndRecipientIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
                            facilityId, empId, recipId, from, to);
        } else if (filterEmployee) {
            visits = consultationVisitRepository
                    .findByFacilityIdAndEmployeeIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
                            facilityId, empId, from, to);
        } else if (filterRecipient) {
            visits = consultationVisitRepository
                    .findByFacilityIdAndRecipientIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
                            facilityId, recipId, from, to);
        } else {
            visits = consultationVisitRepository
                    .findByFacilityIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
                            facilityId, from, to);
        }

        List<Long> visitIds = visits.stream().map(ConsultationVisit::getId).toList();
        Map<Long, WorkJournal> journalsByVisit = new HashMap<>();
        if (!visitIds.isEmpty()) {
            for (WorkJournal j : workJournalRepository.findByFacilityIdAndConsultationVisitIdInAndDeletedAtIsNull(
                    facilityId, visitIds)) {
                if (j.getConsultationVisitId() != null) {
                    journalsByVisit.put(j.getConsultationVisitId(), j);
                }
            }
        }

        Map<Long, String> empNames = loadEmployeeNames(
                facilityId,
                visits.stream().map(ConsultationVisit::getEmployeeId).filter(Objects::nonNull).collect(Collectors.toSet()));

        return visits.stream()
                .map(v -> toVisitDto(
                        v,
                        journalsByVisit.get(v.getId()),
                        empNames.getOrDefault(v.getEmployeeId(), "")))
                .toList();
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public ConsultationVisitDto createVisit(CreateConsultationVisitRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        long employeeId = parseLongId(request.employeeId(), "employeeId");
        long recipientId = parseLongId(request.recipientId(), "recipientId");
        requireEmployee(facilityId, employeeId);
        requireRecipient(facilityId, recipientId);

        LocalDate visitDate = parseDate(request.date(), "date");
        LocalTime plannedStart = parseTime(request.plannedStartTime(), "plannedStartTime", true);
        LocalTime plannedEnd = parseTime(request.plannedEndTime(), "plannedEndTime", false);
        LocalTime actualStart = parseTime(request.actualStartTime(), "actualStartTime", false);
        LocalTime actualEnd = parseTime(request.actualEndTime(), "actualEndTime", false);

        ConsultStatus status = resolveStatus(request.consultStatus(), actualStart, actualEnd);
        ConsultType type = request.consultType() != null ? request.consultType() : ConsultType.regular;

        ConsultationVisit visit = ConsultationVisit.create(
                facilityId,
                employeeId,
                recipientId,
                visitDate,
                status,
                type,
                plannedStart,
                plannedEnd,
                actualStart,
                actualEnd,
                request.notes(),
                UserScope.currentUserIdOrNull());
        consultationVisitRepository.save(visit);
        return toVisitDto(visit, null, resolveEmployeeName(facilityId, employeeId));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public ConsultationVisitDto updateVisit(Long id, UpdateConsultationVisitRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        ConsultationVisit visit = requireVisit(facilityId, id);

        LocalTime plannedStart = parseTime(request.plannedStartTime(), "plannedStartTime", true);
        LocalTime plannedEnd = parseTime(request.plannedEndTime(), "plannedEndTime", false);
        LocalTime actualStart = parseTime(request.actualStartTime(), "actualStartTime", false);
        LocalTime actualEnd = parseTime(request.actualEndTime(), "actualEndTime", false);
        ConsultStatus status = resolveStatus(request.consultStatus(), actualStart, actualEnd);
        ConsultType type =
                request.consultType() != null ? request.consultType() : visit.getConsultType();

        visit.update(
                status,
                type,
                plannedStart,
                plannedEnd,
                actualStart,
                actualEnd,
                request.notes(),
                UserScope.currentUserIdOrNull());

        WorkJournal journal = workJournalRepository
                .findByFacilityIdAndConsultationVisitIdAndDeletedAtIsNull(facilityId, id)
                .orElse(null);
        return toVisitDto(
                visit, journal, resolveEmployeeName(facilityId, visit.getEmployeeId()));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public void deleteVisit(Long id) {
        String facilityId = facilityScope.requireFacilityId();
        ConsultationVisit visit = requireVisit(facilityId, id);
        Long userId = UserScope.currentUserIdOrNull();
        visit.softDelete(userId);
        workJournalRepository
                .findByFacilityIdAndConsultationVisitIdAndDeletedAtIsNull(facilityId, id)
                .ifPresent(j -> j.softDelete(userId));
    }

    /** com + schedule 조회가 섞이므로 메서드 단위 트랜잭션을 두지 않는다. */
    public List<ConsultationRecipientDto> listRecipients(
            String query,
            Boolean activeOnly,
            String gradeFilter,
            String serviceFilter,
            String groupId,
            String subgroupId,
            Integer year,
            Integer month,
            Boolean hasSchedulesInMonth) {
        String facilityId = facilityScope.requireFacilityId();
        List<Recipient> recipients = comRecipientRepository.findByFacilityId(facilityId, query);
        Map<Long, List<String>> serviceTypesByRecipient = loadServiceTypes(facilityId);
        Set<Long> groupRecipientIds = groupFilterSupport.resolveRecipientIds(groupId, subgroupId);

        Set<Long> monthScheduleIds = Set.of();
        if (year != null && month != null) {
            monthScheduleIds =
                    serviceScheduleRepository.findRecipientIdsWithActiveInMonth(facilityId, year, month);
        }
        Set<Long> monthScheduleIdsFinal = monthScheduleIds;

        boolean onlyActive = activeOnly == null || activeOnly;
        return recipients.stream()
                .filter(r -> !onlyActive || "수급중".equals(r.getContractStatus()))
                .filter(r -> groupFilterSupport.matchesRecipient(String.valueOf(r.getId()), groupRecipientIds))
                .filter(r -> {
                    if (!StringUtils.hasText(gradeFilter) || "all".equals(gradeFilter)) {
                        return true;
                    }
                    String grade = r.getGrade() != null ? r.getGrade() : "";
                    if ("in".equals(gradeFilter) || gradeFilter.contains("인지")) {
                        return grade.contains("인지");
                    }
                    if (gradeFilter.matches("\\d")) {
                        return grade.startsWith(gradeFilter);
                    }
                    return gradeFilter.equals(grade);
                })
                .filter(r -> {
                    if (!StringUtils.hasText(serviceFilter) || "all".equals(serviceFilter)) {
                        return true;
                    }
                    return serviceTypesByRecipient
                            .getOrDefault(r.getId(), List.of())
                            .contains(serviceFilter);
                })
                .filter(r -> {
                    if (hasSchedulesInMonth == null) {
                        return true;
                    }
                    boolean has = monthScheduleIdsFinal.contains(r.getId());
                    return hasSchedulesInMonth == has;
                })
                .map(r -> {
                    List<RecipientGuardian> guardians =
                            comRecipientGuardianRepository.findByRecipient_IdOrderBySortOrderAsc(r.getId());
                    RecipientGuardian g = guardians.isEmpty() ? null : guardians.get(0);
                    String addr = joinAddress(r.getAddress(), r.getAddressDetail());
                    return new ConsultationRecipientDto(
                            String.valueOf(r.getId()),
                            r.getName(),
                            r.getGrade(),
                            r.getReduction(),
                            r.getCertNo() != null ? r.getCertNo() : "",
                            r.getContractStatus(),
                            r.getLegalDob() != null ? r.getLegalDob().toString() : null,
                            r.getMobile(),
                            addr,
                            g != null ? g.getName() : null,
                            g != null ? (StringUtils.hasText(g.getMobile()) ? g.getMobile() : g.getHomePhone()) : null,
                            serviceTypesByRecipient.getOrDefault(r.getId(), List.of()),
                            monthScheduleIdsFinal.contains(r.getId()));
                })
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<RecipientScheduleItemDto> listRecipientSchedules(
            String recipientId, int year, int month) {
        String facilityId = facilityScope.requireFacilityId();
        long rid = parseLongId(recipientId, "recipientId");
        requireRecipient(facilityId, rid);

        List<ServiceSchedule> schedules =
                serviceScheduleRepository.findActiveForRecipientMonth(facilityId, rid, year, month);
        Set<Long> empIds = schedules.stream()
                .map(ServiceSchedule::getEmployeeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> empNames = new HashMap<>();
        if (!empIds.isEmpty()) {
            for (Employee e :
                    comEmployeeRepository.findByIdInAndFacility_IdAndDeletedAtIsNull(empIds, facilityId)) {
                empNames.put(e.getId(), e.getName());
            }
        }

        return schedules.stream()
                .map(s -> new RecipientScheduleItemDto(
                        String.valueOf(s.getId()),
                        s.getServiceDate().toString(),
                        s.getServiceType().name(),
                        s.getScheduleKind().name(),
                        formatTime(s.getStartTime()),
                        formatTime(s.getEndTime()),
                        s.getDurationMinutes() != null ? s.getDurationMinutes() : 0,
                        String.valueOf(s.getEmployeeId()),
                        empNames.getOrDefault(s.getEmployeeId(), "")))
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<WorkJournalSummaryDto> listJournals(
            String recipientId, String visitId, Integer year, Integer month) {
        String facilityId = facilityScope.requireFacilityId();
        if (StringUtils.hasText(visitId)) {
            long vid = parseLongId(visitId, "visitId");
            return workJournalRepository
                    .findByFacilityIdAndConsultationVisitIdAndDeletedAtIsNull(facilityId, vid)
                    .map(j -> List.of(toJournalSummary(j)))
                    .orElse(List.of());
        }
        if (!StringUtils.hasText(recipientId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recipientId or visitId is required");
        }
        long rid = parseLongId(recipientId, "recipientId");
        List<WorkJournal> journals;
        if (year != null && month != null) {
            YearMonth ym = YearMonth.of(year, month);
            journals = workJournalRepository
                    .findByFacilityIdAndRecipientIdAndWrittenDateBetweenAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
                            facilityId, rid, ym.atDay(1), ym.atEndOfMonth());
        } else {
            journals = workJournalRepository
                    .findByFacilityIdAndRecipientIdAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
                            facilityId, rid);
        }
        return journals.stream().map(this::toJournalSummary).toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public WorkJournalDetailDto getJournal(Long id) {
        String facilityId = facilityScope.requireFacilityId();
        return toJournalDetail(requireJournal(facilityId, id));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public WorkJournalDetailDto createJournal(CreateWorkJournalRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        if (request.formData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData is required");
        }
        long recipientId = parseLongId(request.recipientId(), "recipientId");
        long employeeId = parseLongId(request.employeeId(), "employeeId");
        requireRecipient(facilityId, recipientId);
        requireEmployee(facilityId, employeeId);

        Long visitId = null;
        ConsultationVisit visit = null;
        if (StringUtils.hasText(request.consultationVisitId())) {
            visitId = parseLongId(request.consultationVisitId(), "consultationVisitId");
            visit = requireVisit(facilityId, visitId);
            if (workJournalRepository
                    .findByFacilityIdAndConsultationVisitIdAndDeletedAtIsNull(facilityId, visitId)
                    .isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 방문에 이미 일지가 있습니다.");
            }
        }

        LocalDate writtenDate;
        if (StringUtils.hasText(request.writtenDate())) {
            writtenDate = parseDate(request.writtenDate(), "writtenDate");
        } else if (visit != null) {
            writtenDate = visit.getVisitDate();
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "writtenDate is required");
        }

        JournalStatus status =
                request.journalStatus() != null ? request.journalStatus() : JournalStatus.draft;
        Long userId = UserScope.currentUserIdOrNull();
        WorkJournal journal = WorkJournal.create(
                facilityId,
                visitId,
                recipientId,
                employeeId,
                status,
                writtenDate,
                toJson(request.formData()),
                userId);
        workJournalRepository.save(journal);

        if (status == JournalStatus.completed && visit != null) {
            visit.markCompletedIfPlanned(userId);
        }
        return toJournalDetail(journal);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public WorkJournalDetailDto updateJournal(Long id, UpdateWorkJournalRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        WorkJournal journal = requireJournal(facilityId, id);
        if (request.formData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData is required");
        }
        LocalDate writtenDate = StringUtils.hasText(request.writtenDate())
                ? parseDate(request.writtenDate(), "writtenDate")
                : journal.getWrittenDate();
        JournalStatus status =
                request.journalStatus() != null ? request.journalStatus() : journal.getJournalStatus();
        Long userId = UserScope.currentUserIdOrNull();
        journal.update(status, writtenDate, toJson(request.formData()), userId);

        if (status == JournalStatus.completed && journal.getConsultationVisitId() != null) {
            consultationVisitRepository
                    .findByIdAndFacilityIdAndDeletedAtIsNull(journal.getConsultationVisitId(), facilityId)
                    .ifPresent(v -> v.markCompletedIfPlanned(userId));
        }
        return toJournalDetail(journal);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public void deleteJournal(Long id) {
        String facilityId = facilityScope.requireFacilityId();
        WorkJournal journal = requireJournal(facilityId, id);
        journal.softDelete(UserScope.currentUserIdOrNull());
    }

    private ConsultStatus resolveStatus(
            ConsultStatus requested, LocalTime actualStart, LocalTime actualEnd) {
        if (requested == ConsultStatus.unable) {
            return ConsultStatus.unable;
        }
        if (actualStart != null && actualEnd != null) {
            return ConsultStatus.completed;
        }
        if (requested != null) {
            return requested;
        }
        return ConsultStatus.planned;
    }

    private ConsultationVisitDto toVisitDto(
            ConsultationVisit v, WorkJournal journal, String employeeName) {
        return new ConsultationVisitDto(
                String.valueOf(v.getId()),
                String.valueOf(v.getEmployeeId()),
                employeeName != null ? employeeName : "",
                String.valueOf(v.getRecipientId()),
                v.getVisitDate().toString(),
                v.getConsultStatus(),
                v.getConsultType(),
                formatTime(v.getPlannedStartTime()),
                formatTime(v.getPlannedEndTime()),
                formatTime(v.getActualStartTime()),
                formatTime(v.getActualEndTime()),
                v.getNotes(),
                journal != null,
                journal != null ? String.valueOf(journal.getId()) : null,
                journal != null ? journal.getJournalStatus().name() : null);
    }

    private Map<Long, String> loadEmployeeNames(String facilityId, Set<Long> empIds) {
        Map<Long, String> empNames = new HashMap<>();
        if (empIds == null || empIds.isEmpty()) {
            return empNames;
        }
        for (Employee e :
                comEmployeeRepository.findByIdInAndFacility_IdAndDeletedAtIsNull(empIds, facilityId)) {
            empNames.put(e.getId(), e.getName());
        }
        return empNames;
    }

    private String resolveEmployeeName(String facilityId, Long employeeId) {
        if (employeeId == null) {
            return "";
        }
        return loadEmployeeNames(facilityId, Set.of(employeeId)).getOrDefault(employeeId, "");
    }

    private WorkJournalSummaryDto toJournalSummary(WorkJournal j) {
        return new WorkJournalSummaryDto(
                String.valueOf(j.getId()),
                j.getConsultationVisitId() != null ? String.valueOf(j.getConsultationVisitId()) : null,
                String.valueOf(j.getRecipientId()),
                String.valueOf(j.getEmployeeId()),
                j.getJournalStatus(),
                j.getWrittenDate().toString());
    }

    private WorkJournalDetailDto toJournalDetail(WorkJournal j) {
        return new WorkJournalDetailDto(
                String.valueOf(j.getId()),
                j.getConsultationVisitId() != null ? String.valueOf(j.getConsultationVisitId()) : null,
                String.valueOf(j.getRecipientId()),
                String.valueOf(j.getEmployeeId()),
                j.getJournalStatus(),
                j.getWrittenDate().toString(),
                fromJson(j.getFormData()));
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

    private ConsultationVisit requireVisit(String facilityId, Long id) {
        return consultationVisitRepository
                .findByIdAndFacilityIdAndDeletedAtIsNull(id, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방문상담을 찾을 수 없습니다."));
    }

    private WorkJournal requireJournal(String facilityId, Long id) {
        return workJournalRepository
                .findByIdAndFacilityIdAndDeletedAtIsNull(id, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "일지를 찾을 수 없습니다."));
    }

    private void requireEmployee(String facilityId, long employeeId) {
        boolean ok = comEmployeeRepository
                .findByIdInAndFacility_IdAndDeletedAtIsNull(List.of(employeeId), facilityId)
                .stream()
                .anyMatch(e -> e.getId().equals(employeeId));
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 employeeId 입니다.");
        }
    }

    private void requireRecipient(String facilityId, long recipientId) {
        comRecipientRepository
                .findByIdAndFacility_Id(recipientId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 recipientId 입니다."));
    }

    private static String joinAddress(String address, String detail) {
        if (!StringUtils.hasText(address) && !StringUtils.hasText(detail)) {
            return "";
        }
        if (!StringUtils.hasText(detail)) {
            return address;
        }
        if (!StringUtils.hasText(address)) {
            return detail;
        }
        return address + " " + detail;
    }

    private static String formatTime(LocalTime t) {
        return t == null ? null : t.toString().substring(0, 5);
    }

    private static long parseLongId(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 " + field + " 입니다.");
        }
    }

    private static LocalDate parseDate(String value, String field) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 " + field + " 입니다.");
        }
    }

    private static LocalTime parseTime(String value, String field, boolean required) {
        if (!StringUtils.hasText(value)) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required");
            }
            return null;
        }
        try {
            String v = value.trim();
            if (v.length() == 5) {
                v = v + ":00";
            }
            return LocalTime.parse(v);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 " + field + " 입니다.");
        }
    }

    private String toJson(Map<String, Object> formData) {
        try {
            return objectMapper.writeValueAsString(formData);
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "formData JSON 변환 실패");
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (!StringUtils.hasText(json)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (JsonProcessingException ex) {
            return Map.of();
        }
    }
}
