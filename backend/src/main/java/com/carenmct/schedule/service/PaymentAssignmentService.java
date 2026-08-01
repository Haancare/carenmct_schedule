package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.dto.paymentassignment.AnnualScheduleResponse;
import com.carenmct.schedule.dto.paymentassignment.AnnualScheduleRowDto;
import com.carenmct.schedule.dto.paymentassignment.CareWorkerDto;
import com.carenmct.schedule.dto.paymentassignment.MonthScheduleSummaryDto;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleQuery;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleResponse;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleRowDto;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentListQuery;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientsResponse;
import com.carenmct.schedule.dto.paymentassignment.WeeklyCalendarWeekDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyRecipientListQuery;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleEntryDto;
import com.carenmct.schedule.dto.paymentassignment.RecipientGroupDto;
import com.carenmct.schedule.dto.paymentassignment.RecipientGroupSubgroupDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleQuery;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleResponse;
import com.carenmct.schedule.domain.com.ComGroup;
import com.carenmct.schedule.mapper.PaymentAssignmentMapper;
import com.carenmct.schedule.repository.com.ComGroupRepository;
import com.carenmct.schedule.repository.com.ComGroupSubgroupRepository;
import com.carenmct.schedule.repository.com.ComRecipientMemoRepository;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.schedule.RecipientMonthKindCount;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleSearchCondition;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.support.EmployeePositionSupport;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PaymentAssignmentService {

    private final ServiceScheduleRepository serviceScheduleRepository;
    private final ComRecipientMemoRepository comRecipientMemoRepository;
    private final PaymentAssignmentRecipientLoader recipientLoader;
    private final ComEmployeeRepository comEmployeeRepository;
    private final ComGroupRepository comGroupRepository;
    private final ComGroupSubgroupRepository comGroupSubgroupRepository;
    private final FacilityScopeResolver facilityScope;

    public PaymentAssignmentRecipientsResponse getRecipients(PaymentAssignmentListQuery query) {
        List<PaymentAssignmentRecipientDto> filtered = recipientLoader.loadFiltered(query);
        return new PaymentAssignmentRecipientsResponse(filtered, filtered.size());
    }

    public AnnualScheduleResponse getAnnualSchedule(PaymentAssignmentListQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        List<PaymentAssignmentRecipientDto> filtered = recipientLoader.loadFiltered(query);

        if (filtered.isEmpty()) {
            return new AnnualScheduleResponse(List.of(), 0);
        }

        Map<Long, Map<Integer, MonthCounts>> countByRecipient = loadMonthCounts(
                facilityId,
                query.year(),
                filtered.stream().map(dto -> Long.parseLong(dto.id())).collect(Collectors.toSet()));

        List<AnnualScheduleRowDto> rows = filtered.stream()
                .map(recipient -> new AnnualScheduleRowDto(
                        recipient, buildMonthSummaries(Long.parseLong(recipient.id()), countByRecipient)))
                .toList();

        return new AnnualScheduleResponse(rows, rows.size());
    }

    public MonthlyScheduleResponse getMonthlySchedule(MonthlyScheduleQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        List<PaymentAssignmentRecipientDto> filtered = recipientLoader.loadFilteredForMonth(
                query.toListQuery(), query.year(), query.month());

        if (filtered.isEmpty()) {
            int lastDay = YearMonth.of(query.year(), query.month()).lengthOfMonth();
            return new MonthlyScheduleResponse(List.of(), 0, lastDay);
        }

        var recipientIds = filtered.stream()
                .map(dto -> Long.parseLong(dto.id()))
                .collect(Collectors.toSet());

        var schedules = serviceScheduleRepository.findActive(ServiceScheduleSearchCondition.forFacilityMonth(
                facilityId, query.year(), query.month(), recipientIds, query.scheduleKind()));

        List<MonthlyScheduleRowDto> rows = MonthlyScheduleRowBuilder.build(
                filtered, schedules, query.year(), query.month(), query.scheduleKind());

        int lastDay = YearMonth.of(query.year(), query.month()).lengthOfMonth();
        // totalCount = 수급자 명수 (행 수가 아님)
        return new MonthlyScheduleResponse(rows, filtered.size(), lastDay);
    }

    public PaymentAssignmentRecipientsResponse getWeeklyRecipients(WeeklyRecipientListQuery query) {
        List<PaymentAssignmentRecipientDto> filtered = recipientLoader.loadWeeklyPool(query);
        return new PaymentAssignmentRecipientsResponse(filtered, filtered.size());
    }

    public WeeklyScheduleResponse getWeeklySchedule(WeeklyScheduleQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientId;
        try {
            recipientId = Long.parseLong(query.recipientId());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found");
        }

        PaymentAssignmentRecipientDto recipient =
                recipientLoader.loadRecipientDto(facilityId, recipientId, query.year());
        if (recipient == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found");
        }

        var schedules = serviceScheduleRepository.findActive(ServiceScheduleSearchCondition.forRecipientYear(
                facilityId, recipientId, query.year(), query.scheduleKind()));

        Map<String, List<WeeklyScheduleEntryDto>> entriesByDate = new TreeMap<>();
        List<String> dates = new ArrayList<>();
        for (var schedule : schedules) {
            WeeklyScheduleEntryDto entry = PaymentAssignmentMapper.toWeeklyEntry(schedule);
            entriesByDate.computeIfAbsent(entry.date(), ignored -> new ArrayList<>()).add(entry);
            if (!dates.contains(entry.date())) {
                dates.add(entry.date());
            }
        }

        List<WeeklyCalendarWeekDto> weeks = WeeklyCalendarBuilder.buildWeeksFromDates(dates);
        Map<String, String> dayMemos =
                new LinkedHashMap<>(comRecipientMemoRepository.findDayMemosByRecipientAndYear(recipientId, query.year()));

        return new WeeklyScheduleResponse(recipient, weeks, entriesByDate, dayMemos);
    }

    public List<CareWorkerDto> getCareWorkers() {
        String facilityId = facilityScope.requireFacilityId();
        return comEmployeeRepository.findByFacility_IdAndDeletedAtIsNullOrderByNameAsc(facilityId).stream()
                .map(employee -> new CareWorkerDto(
                        String.valueOf(employee.getId()),
                        employee.getName(),
                        employee.getNickname(),
                        employee.getDob() != null ? employee.getDob().toString() : null,
                        EmployeePositionSupport.normalizePositionCode(employee.getPosition()),
                        employee.getStatus()))
                .toList();
    }

    public List<RecipientGroupDto> getRecipientGroups() {
        String facilityId = facilityScope.requireFacilityId();
        List<ComGroup> groups =
                comGroupRepository.findByFacility_IdAndTypeOrderByNameAsc(facilityId, "recipient");

        return groups.stream().map(this::toRecipientGroupDto).toList();
    }

    private RecipientGroupDto toRecipientGroupDto(ComGroup group) {
        List<RecipientGroupSubgroupDto> subgroups = group.isHasSubgroups()
                ? comGroupSubgroupRepository.findByGroup_IdOrderBySortOrderAscNameAsc(group.getId()).stream()
                        .map(s -> new RecipientGroupSubgroupDto(String.valueOf(s.getId()), s.getName()))
                        .toList()
                : List.of();

        return new RecipientGroupDto(
                String.valueOf(group.getId()),
                group.getName(),
                group.getColor(),
                group.isHasSubgroups(),
                subgroups);
    }

    private Map<Long, Map<Integer, MonthCounts>> loadMonthCounts(
            String facilityId, int year, java.util.Set<Long> recipientIds) {
        List<RecipientMonthKindCount> counts =
                serviceScheduleRepository.countActiveByRecipientMonthKind(facilityId, year, recipientIds);

        Map<Long, Map<Integer, MonthCounts>> result = new HashMap<>();
        for (RecipientMonthKindCount count : counts) {
            result.computeIfAbsent(count.getRecipientId(), ignored -> new HashMap<>())
                    .computeIfAbsent(count.getMonth(), ignored -> new MonthCounts())
                    .add(count.getScheduleKind(), count.getCount());
        }
        return result;
    }

    private List<MonthScheduleSummaryDto> buildMonthSummaries(
            Long recipientId, Map<Long, Map<Integer, MonthCounts>> countByRecipient) {
        Map<Integer, MonthCounts> byMonth = countByRecipient.getOrDefault(recipientId, Map.of());

        return IntStream.rangeClosed(1, 12)
                .mapToObj(month -> {
                    MonthCounts counts = byMonth.getOrDefault(month, MonthCounts.EMPTY);
                    return new MonthScheduleSummaryDto(month, counts.planCount(), counts.claimCount());
                })
                .toList();
    }

    private static final class MonthCounts {
        private static final MonthCounts EMPTY = new MonthCounts();

        private int planCount;
        private int claimCount;

        void add(ScheduleKind kind, long count) {
            int value = Math.toIntExact(count);
            if (kind == ScheduleKind.plan) {
                planCount += value;
            } else if (kind == ScheduleKind.claim) {
                claimCount += value;
            }
        }

        int planCount() {
            return planCount;
        }

        int claimCount() {
            return claimCount;
        }
    }
}
