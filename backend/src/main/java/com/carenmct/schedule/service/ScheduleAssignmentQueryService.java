package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Employee;
import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.com.RecipientGuardian;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentContactDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentListItemDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentListQuery;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentMonthResponse;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentRecipientDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleEntryResponse;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleYearMonthCountsResponse;
import com.carenmct.schedule.dto.scheduleassignment.WorkerScheduleEntryDto;
import com.carenmct.schedule.repository.schedule.ServiceScheduleSearchCondition;
import java.time.LocalDate;
import com.carenmct.schedule.mapper.PaymentAssignmentMapper;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.com.ComRecipientGuardianRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.RecipientMonthKindCount;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ScheduleAssignmentQueryService {

    private final ServiceScheduleRepository serviceScheduleRepository;
    private final ComRecipientRepository comRecipientRepository;
    private final ComRecipientGuardianRepository comRecipientGuardianRepository;
    private final ComEmployeeRepository comEmployeeRepository;
    private final PaymentAssignmentRecipientLoader recipientLoader;
    private final FacilityScopeResolver facilityScope;
    private final ReferenceBenefitLimitService referenceBenefitLimitService;

    public ScheduleAssignmentMonthResponse getMonth(
            String recipientId, int year, int month, ScheduleKind scheduleKind) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseLongId(recipientId, "recipientId");

        Recipient recipientEntity = comRecipientRepository
                .findByIdAndFacility_Id(recipientLongId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        PaymentAssignmentRecipientDto baseRecipient =
                recipientLoader.toRecipientDto(facilityId, recipientEntity, year);

        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        List<ServiceSchedule> monthSchedules = serviceScheduleRepository.findActive(
                ServiceScheduleSearchCondition.builder()
                        .facilityId(facilityId)
                        .recipientId(recipientLongId)
                        .dateFrom(from)
                        .dateTo(to)
                        .scheduleKind(scheduleKind)
                        .build());

        List<ScheduleEntryResponse> schedules = monthSchedules.stream()
                .map(PaymentAssignmentMapper::toScheduleEntryResponse)
                .toList();

        ScheduleAssignmentRecipientDto recipient = toAssignmentRecipient(
                baseRecipient, recipientEntity, facilityId, recipientLongId);

        int monthlyLimit = referenceBenefitLimitService.resolveMonthlyLimit(
                year, monthSchedules, baseRecipient.gradeText());

        return new ScheduleAssignmentMonthResponse(
                recipient,
                schedules,
                ScheduleAssignmentPaymentStatusBuilder.build(
                        monthSchedules, scheduleKind, baseRecipient.reduction(), monthlyLimit));
    }

    public List<WorkerScheduleEntryDto> getWorkerMonthSchedules(
            String workerId, int year, int month, ScheduleKind scheduleKind) {
        String facilityId = facilityScope.requireFacilityId();
        long employeeId = parseLongId(workerId, "workerId");
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());

        ServiceScheduleSearchCondition condition = ServiceScheduleSearchCondition.builder()
                .facilityId(facilityId)
                .dateFrom(from)
                .dateTo(to)
                .employeeId(employeeId)
                .scheduleKind(scheduleKind)
                .build();

        List<ServiceSchedule> schedules = serviceScheduleRepository.findActive(condition);
        Set<Long> recipientIds = schedules.stream()
                .map(ServiceSchedule::getRecipientId)
                .collect(Collectors.toSet());
        Map<Long, String> recipientNames = loadRecipientNames(facilityId, recipientIds);

        return schedules.stream()
                .map(schedule -> new WorkerScheduleEntryDto(
                        schedule.getId(),
                        String.valueOf(schedule.getRecipientId()),
                        recipientNames.getOrDefault(
                                schedule.getRecipientId(), String.valueOf(schedule.getRecipientId())),
                        schedule.getServiceDate().toString(),
                        schedule.getServiceType(),
                        schedule.getScheduleKind(),
                        formatTime(schedule.getStartTime()),
                        formatTime(schedule.getEndTime()),
                        schedule.getDurationMinutes()))
                .toList();
    }

    public List<ScheduleAssignmentListItemDto> getList(ScheduleAssignmentListQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        List<Recipient> recipients = comRecipientRepository.findByFacilityId(facilityId, null);
        if (recipients.isEmpty()) {
            return List.of();
        }

        Set<Long> withSchedulesInYear =
                serviceScheduleRepository.findRecipientIdsWithActiveInYear(facilityId, query.year());
        Map<Long, MonthKindCounts> countsByRecipient =
                loadMonthKindCountsForFacility(facilityId, query.year(), query.month());

        boolean showAllActive = query.showAllActive() == null || query.showAllActive();

        // 해당 월 일정 있음 ∪ (토글 ON 시) 계약상태 수급중
        return recipients.stream()
                .filter(recipient -> {
                    MonthKindCounts counts =
                            countsByRecipient.getOrDefault(recipient.getId(), MonthKindCounts.EMPTY);
                    boolean hasMonthSchedules = counts.plan() > 0 || counts.claim() > 0;
                    boolean isActive = "수급중".equals(recipient.getContractStatus());
                    return hasMonthSchedules || (showAllActive && isActive);
                })
                .map(recipient -> {
                    MonthKindCounts counts =
                            countsByRecipient.getOrDefault(recipient.getId(), MonthKindCounts.EMPTY);
                    PaymentAssignmentRecipientDto dto = PaymentAssignmentMapper.toRecipientDto(
                            recipient,
                            List.of(),
                            withSchedulesInYear.contains(recipient.getId()),
                            Set.of());
                    return new ScheduleAssignmentListItemDto(dto, counts.plan(), counts.claim());
                })
                .sorted(Comparator.comparing(item -> item.recipient().name()))
                .toList();
    }

    public ScheduleYearMonthCountsResponse getYearMonthCounts(String recipientId, int year) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseLongId(recipientId, "recipientId");

        if (comRecipientRepository.findByIdAndFacility_Id(recipientLongId, facilityId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found");
        }

        List<RecipientMonthKindCount> counts = serviceScheduleRepository.countActiveByRecipientMonthKind(
                facilityId, year, Set.of(recipientLongId));

        Map<Integer, ScheduleYearMonthCountsResponse.MonthKindCountDto> map = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            map.put(month, new ScheduleYearMonthCountsResponse.MonthKindCountDto(0, 0));
        }
        for (RecipientMonthKindCount count : counts) {
            ScheduleYearMonthCountsResponse.MonthKindCountDto current =
                    map.getOrDefault(count.getMonth(), new ScheduleYearMonthCountsResponse.MonthKindCountDto(0, 0));
            if (count.getScheduleKind() == ScheduleKind.plan) {
                map.put(
                        count.getMonth(),
                        new ScheduleYearMonthCountsResponse.MonthKindCountDto(
                                Math.toIntExact(count.getCount()), current.claim()));
            } else if (count.getScheduleKind() == ScheduleKind.claim) {
                map.put(
                        count.getMonth(),
                        new ScheduleYearMonthCountsResponse.MonthKindCountDto(
                                current.plan(), Math.toIntExact(count.getCount())));
            }
        }

        return new ScheduleYearMonthCountsResponse(map);
    }

    private Map<Long, MonthKindCounts> loadMonthKindCountsForFacility(
            String facilityId, int year, int month) {
        List<RecipientMonthKindCount> counts =
                serviceScheduleRepository.countActiveByFacilityForMonth(facilityId, year, month);

        Map<Long, MonthKindCounts> result = new HashMap<>();
        for (RecipientMonthKindCount count : counts) {
            MonthKindCounts current =
                    result.computeIfAbsent(count.getRecipientId(), ignored -> new MonthKindCounts());
            current.add(count.getScheduleKind(), count.getCount());
        }
        return result;
    }

    private ScheduleAssignmentRecipientDto toAssignmentRecipient(
            PaymentAssignmentRecipientDto base,
            Recipient entity,
            String facilityId,
            long recipientId) {
        List<ScheduleAssignmentContactDto> contacts = new ArrayList<>();
        String selfMobile = entity != null ? entity.getMobile() : null;
        contacts.add(new ScheduleAssignmentContactDto(base.name(), "self", null, selfMobile));

        List<RecipientGuardian> guardians =
                comRecipientGuardianRepository.findByRecipient_IdOrderBySortOrderAsc(recipientId);
        for (RecipientGuardian guardian : guardians) {
            String relation = StringUtils.hasText(guardian.getRelation())
                    ? guardian.getRelation()
                    : guardian.getRelationDirect();
            contacts.add(new ScheduleAssignmentContactDto(
                    guardian.getName() != null ? guardian.getName() : "-",
                    "guardian",
                    relation,
                    guardian.getMobile()));
        }

        Map<Long, Employee> employeesById = loadEmployeesByIds(facilityId, base.assignedCareWorkerIds());
        for (String workerId : base.assignedCareWorkerIds()) {
            long employeeId = parseLongId(workerId, "workerId");
            Employee employee = employeesById.get(employeeId);
            String name = employee != null ? employee.getName() : workerId;
            String phone = employee != null ? employee.getMobile() : null;
            contacts.add(new ScheduleAssignmentContactDto(name, "worker", null, phone));
        }

        String validFrom = entity != null && entity.getValidFrom() != null ? entity.getValidFrom().toString() : null;
        String validTo = entity != null && entity.getValidTo() != null ? entity.getValidTo().toString() : null;
        String mobile = entity != null ? entity.getMobile() : null;

        return new ScheduleAssignmentRecipientDto(
                base.id(),
                base.name(),
                base.legalDob(),
                base.gradeText(),
                base.reduction(),
                base.certNo(),
                base.contractStatus(),
                base.assignedCareWorkerIds(),
                base.hasSchedulesInYear(),
                base.serviceTypesInYear(),
                validFrom,
                validTo,
                mobile,
                base.serviceTypesInYear(),
                contacts);
    }

    private Map<Long, Employee> loadEmployeesByIds(String facilityId, List<String> workerIds) {
        if (workerIds == null || workerIds.isEmpty()) {
            return Map.of();
        }
        Set<Long> ids = workerIds.stream()
                .map(id -> parseLongId(id, "workerId"))
                .collect(Collectors.toSet());
        return comEmployeeRepository.findByIdInAndFacility_IdAndDeletedAtIsNull(ids, facilityId).stream()
                .collect(Collectors.toMap(Employee::getId, employee -> employee, (a, b) -> a));
    }

    private Map<Long, String> loadRecipientNames(String facilityId, Set<Long> recipientIds) {
        if (recipientIds.isEmpty()) {
            return Map.of();
        }
        return comRecipientRepository.findAllById(recipientIds).stream()
                .filter(recipient -> recipient.getFacility() != null
                        && facilityId.equals(recipient.getFacility().getId()))
                .collect(Collectors.toMap(Recipient::getId, Recipient::getName, (a, b) -> a));
    }

    private static String formatTime(java.time.LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    private static long parseLongId(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
    }

    private static final class MonthKindCounts {
        private static final MonthKindCounts EMPTY = new MonthKindCounts();

        private int plan;
        private int claim;

        void add(ScheduleKind kind, long count) {
            int value = Math.toIntExact(count);
            if (kind == ScheduleKind.plan) {
                plan += value;
            } else if (kind == ScheduleKind.claim) {
                claim += value;
            }
        }

        int plan() {
            return plan;
        }

        int claim() {
            return claim;
        }
    }
}
