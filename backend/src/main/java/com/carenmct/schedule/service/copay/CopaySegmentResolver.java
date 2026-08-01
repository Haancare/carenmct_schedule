package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.copay.CopayConfirmation;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationListQuery;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleSearchCondition;
import com.carenmct.schedule.repository.schedule.copay.CopayConfirmationRepository;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator.PeriodSegment;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** 본인부담금확정 그리드 행(세그먼트) 목록 — 조회·변경 API 공통 */
@Component
@RequiredArgsConstructor
public class CopaySegmentResolver {

    private static final String ACTIVE_CONTRACT = "수급중";

    private final ComRecipientRepository comRecipientRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final CopayConfirmationRepository copayConfirmationRepository;

    public List<CopaySegmentTarget> resolveTargets(
            String facilityId, CopayConfirmationListQuery query, Set<Long> recipientIdFilter) {
        return resolveTargetsWithSchedules(facilityId, query, recipientIdFilter).targets();
    }

    /** 월 일정을 1회만 로드하고 세그먼트 대상과 함께 반환한다. */
    public CopaySegmentResolveResult resolveTargetsWithSchedules(
            String facilityId, CopayConfirmationListQuery query, Set<Long> recipientIdFilter) {
        Map<Long, Recipient> activeRecipients = loadActiveRecipients(facilityId, query.nameQuery());
        if (activeRecipients.isEmpty()) {
            return new CopaySegmentResolveResult(List.of(), Map.of());
        }

        Set<Long> recipientIds = activeRecipients.keySet();
        if (recipientIdFilter != null && !recipientIdFilter.isEmpty()) {
            recipientIds = recipientIds.stream()
                    .filter(recipientIdFilter::contains)
                    .collect(Collectors.toSet());
        }
        final Set<Long> targetRecipientIds = recipientIds;
        if (targetRecipientIds.isEmpty()) {
            return new CopaySegmentResolveResult(List.of(), Map.of());
        }

        List<ServiceSchedule> monthSchedules =
                loadFacilityMonthSchedules(facilityId, query.year(), query.month(), targetRecipientIds);
        Map<Long, List<ServiceSchedule>> schedulesByRecipient = groupSchedulesByRecipient(monthSchedules);

        Map<String, CopayConfirmation> confirmationMap = loadConfirmationMap(
                copayConfirmationRepository.findByFacilityIdAndServiceYearAndServiceMonth(
                        facilityId, query.year(), query.month()));

        List<CopaySegmentTarget> targets = new ArrayList<>();
        activeRecipients.values().stream()
                .filter(recipient -> targetRecipientIds.contains(recipient.getId()))
                .sorted(Comparator.comparing(Recipient::getName, java.text.Collator.getInstance(java.util.Locale.KOREAN)))
                .forEach(recipient -> {
                    Long recipientId = recipient.getId();
                    List<ServiceSchedule> recipientSchedules =
                            schedulesByRecipient.getOrDefault(recipientId, List.of());
                    for (ServiceType serviceType : CopaySegmentAggregator.COPAY_SERVICE_TYPES) {
                        if (query.serviceTypeFilter() != null && query.serviceTypeFilter() != serviceType) {
                            continue;
                        }
                        for (PeriodSegment segment :
                                CopaySegmentAggregator.buildPeriodSegments(
                                        recipientSchedules, serviceType, recipient)) {
                            String key = CopayConfirmationKeys.segmentKey(
                                    recipientId, query.year(), query.month(), serviceType, segment.periodKey());
                            CopayConfirmation existing = confirmationMap.get(key);
                            if (!matchesStatusFilter(query.statusFilter(), existing)) {
                                continue;
                            }
                            targets.add(new CopaySegmentTarget(recipient, serviceType, segment, existing));
                        }
                    }
                });
        return new CopaySegmentResolveResult(targets, schedulesByRecipient);
    }

    public PeriodSegment requireSegment(
            String facilityId,
            Long recipientId,
            int year,
            int month,
            ServiceType serviceType,
            String periodKey) {
        Recipient recipient = comRecipientRepository
                .findByIdAndFacility_Id(recipientId, facilityId)
                .orElse(null);
        if (recipient == null || !ACTIVE_CONTRACT.equals(recipient.getContractStatus())) {
            return null;
        }
        List<ServiceSchedule> schedules = serviceScheduleRepository.findActiveForRecipientMonth(
                facilityId, recipientId, year, month);
        return CopaySegmentAggregator.buildPeriodSegments(schedules, serviceType, recipient).stream()
                .filter(segment -> segment.periodKey().equals(periodKey))
                .findFirst()
                .orElse(null);
    }

    private Map<Long, Recipient> loadActiveRecipients(String facilityId, String nameQuery) {
        return comRecipientRepository.findByFacilityId(facilityId, nameQuery).stream()
                .filter(recipient -> ACTIVE_CONTRACT.equals(recipient.getContractStatus()))
                .collect(Collectors.toMap(
                        Recipient::getId, recipient -> recipient, (a, b) -> a, LinkedHashMap::new));
    }

    private List<ServiceSchedule> loadFacilityMonthSchedules(
            String facilityId, int year, int month, Set<Long> recipientIds) {
        if (recipientIds.isEmpty()) {
            return List.of();
        }
        LocalDate from = LocalDate.of(year, month, 1);
        return serviceScheduleRepository.findActive(ServiceScheduleSearchCondition.builder()
                .facilityId(facilityId)
                .dateFrom(from)
                .dateTo(from.withDayOfMonth(from.lengthOfMonth()))
                .recipientIds(recipientIds)
                .build());
    }

    private static Map<Long, List<ServiceSchedule>> groupSchedulesByRecipient(List<ServiceSchedule> schedules) {
        Map<Long, List<ServiceSchedule>> grouped = new LinkedHashMap<>();
        for (ServiceSchedule schedule : schedules) {
            grouped.computeIfAbsent(schedule.getRecipientId(), ignored -> new ArrayList<>())
                    .add(schedule);
        }
        return grouped;
    }

    private Map<String, CopayConfirmation> loadConfirmationMap(List<CopayConfirmation> confirmations) {
        Map<String, CopayConfirmation> map = new HashMap<>();
        for (CopayConfirmation confirmation : confirmations) {
            map.put(
                    CopayConfirmationKeys.segmentKey(
                            confirmation.getRecipientId(),
                            confirmation.getServiceYear(),
                            confirmation.getServiceMonth(),
                            confirmation.getServiceType(),
                            confirmation.getPeriodKey()),
                    confirmation);
        }
        return map;
    }

    private static boolean matchesStatusFilter(
            CopayConfirmationListQuery.StatusFilter statusFilter, CopayConfirmation confirmation) {
        return switch (statusFilter) {
            case all -> true;
            case unconfirmed -> confirmation == null;
            case plan -> confirmation != null
                    && confirmation.getConfirmType() == com.carenmct.schedule.domain.schedule.enums.CopayConfirmType.plan;
            case claim -> confirmation != null
                    && confirmation.getConfirmType() == com.carenmct.schedule.domain.schedule.enums.CopayConfirmType.claim;
            case manual -> confirmation != null
                    && confirmation.getConfirmType() == com.carenmct.schedule.domain.schedule.enums.CopayConfirmType.manual;
        };
    }
}
