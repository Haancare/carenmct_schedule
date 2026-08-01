package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.copay.CopayConfirmation;
import com.carenmct.schedule.domain.schedule.copay.NonBenefitCharge;
import com.carenmct.schedule.domain.schedule.copay.NonBenefitOtherItem;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationEntryDto;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationListQuery;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationRowDto;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationRowsResponse;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationStatsDto;
import com.carenmct.schedule.dto.copayconfirmation.CopayMonthSummaryItemDto;
import com.carenmct.schedule.dto.copayconfirmation.CopayMonthSummaryResponse;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleSearchCondition;
import com.carenmct.schedule.repository.schedule.copay.CopayConfirmationRepository;
import com.carenmct.schedule.repository.schedule.copay.NonBenefitChargeRepository;
import com.carenmct.schedule.repository.schedule.copay.NonBenefitOtherItemRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.domain.schedule.copay.CopayPeriodKey;
import com.carenmct.schedule.repository.schedule.CopaySegmentSourceRow;
import com.carenmct.schedule.service.copay.CopayConfirmationKeys;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator.PeriodSegment;
import com.carenmct.schedule.service.copay.CopaySegmentResolveResult;
import com.carenmct.schedule.service.copay.CopaySegmentResolver;
import com.carenmct.schedule.service.copay.CopaySegmentTarget;
import com.carenmct.schedule.service.ReferenceBenefitLimitService;
import java.util.HashSet;
import java.util.Set;
import java.text.Collator;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
public class CopayConfirmationQueryService {

    private static final Collator KOREAN = Collator.getInstance(Locale.KOREAN);
    private static final String ACTIVE_CONTRACT = "수급중";
    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;

    private final FacilityScopeResolver facilityScope;
    private final ComRecipientRepository comRecipientRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final CopayConfirmationRepository copayConfirmationRepository;
    private final NonBenefitChargeRepository nonBenefitChargeRepository;
    private final NonBenefitOtherItemRepository nonBenefitOtherItemRepository;
    private final CopaySegmentResolver segmentResolver;
    private final ReferenceBenefitLimitService referenceBenefitLimitService;

    public CopayMonthSummaryResponse getMonthSummary(int year) {
        String facilityId = facilityScope.requireFacilityId();
        Map<Long, Recipient> activeRecipients = loadActiveRecipients(facilityId, null);
        if (activeRecipients.isEmpty()) {
            return emptyMonthSummary(year);
        }

        // 연간 풀 Entity 대신 세그먼트 소스만 DISTINCT 조회
        List<CopaySegmentSourceRow> sources =
                serviceScheduleRepository.findCopaySegmentSources(facilityId, year);
        Map<Integer, Set<String>> segmentKeysByMonth = new HashMap<>();
        for (CopaySegmentSourceRow source : sources) {
            Recipient recipient = activeRecipients.get(source.recipientId());
            if (recipient == null) {
                continue;
            }
            int gradeNum = ReferenceBenefitLimitService.parseGradeNum(
                    source.gradeSnapshot(), recipient.getGrade());
            String reduction = source.reductionSnapshot() != null && !source.reductionSnapshot().isBlank()
                    ? source.reductionSnapshot().trim()
                    : (recipient.getReduction() != null ? recipient.getReduction() : "");
            String periodKey = CopayPeriodKey.of(gradeNum, reduction);
            String identity = source.recipientId()
                    + "|"
                    + source.serviceType().name()
                    + "|"
                    + periodKey;
            segmentKeysByMonth
                    .computeIfAbsent(source.month(), ignored -> new HashSet<>())
                    .add(identity);
        }

        Map<String, CopayConfirmation> confirmationMap = loadConfirmationMap(
                copayConfirmationRepository.findByFacilityIdAndServiceYear(facilityId, year));

        List<CopayMonthSummaryItemDto> months = new ArrayList<>(12);
        for (int month = 1; month <= 12; month++) {
            Set<String> keys = segmentKeysByMonth.getOrDefault(month, Set.of());
            int total = keys.size();
            int unconfirmed = 0;
            for (String identity : keys) {
                String[] parts = identity.split("\\|", 3);
                Long recipientId = Long.valueOf(parts[0]);
                ServiceType serviceType = ServiceType.valueOf(parts[1]);
                String periodKey = parts[2];
                if (!confirmationMap.containsKey(CopayConfirmationKeys.segmentKey(
                        recipientId, year, month, serviceType, periodKey))) {
                    unconfirmed++;
                }
            }
            months.add(new CopayMonthSummaryItemDto(month, total, unconfirmed));
        }

        return new CopayMonthSummaryResponse(year, months);
    }

    public CopayConfirmationRowsResponse getRows(CopayConfirmationListQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        CopaySegmentResolveResult resolved = segmentResolver.resolveTargetsWithSchedules(facilityId, query, null);
        List<CopaySegmentTarget> targets = resolved.targets();
        if (targets.isEmpty()) {
            return new CopayConfirmationRowsResponse(
                    query.year(),
                    query.month(),
                    List.of(),
                    new CopayConfirmationStatsDto(0, 0, 0));
        }

        java.util.Set<Long> recipientIds = targets.stream()
                .map(t -> t.recipient().getId())
                .collect(Collectors.toSet());

        Map<Long, Integer> nonBenefitTotals = loadNonBenefitTotals(recipientIds, query.year(), query.month());

        Map<Long, List<ServiceSchedule>> schedulesByRecipient = resolved.schedulesByRecipient();

        Map<Long, Integer> limitExcessByRecipient = new HashMap<>();
        for (CopaySegmentTarget target : targets) {
            Long recipientId = target.recipient().getId();
            if (limitExcessByRecipient.containsKey(recipientId)) {
                continue;
            }
            List<ServiceSchedule> recipientMonthSchedules =
                    schedulesByRecipient.getOrDefault(recipientId, List.of());
            limitExcessByRecipient.put(
                    recipientId,
                    computeLimitExcess(recipientMonthSchedules, target.recipient().getGrade(), query.year()));
        }

        List<CopayConfirmationRowDto> rows = targets.stream()
                .map(target -> toRowDto(
                        target.recipient(),
                        target.serviceType(),
                        target.segment(),
                        target.existingConfirmation(),
                        limitExcessByRecipient.getOrDefault(target.recipient().getId(), 0),
                        nonBenefitTotals.getOrDefault(target.recipient().getId(), 0)))
                .sorted(rowComparator())
                .toList();

        int confirmed = (int) rows.stream()
                .filter(row -> row.confirmation() != null)
                .count();
        CopayConfirmationStatsDto stats =
                new CopayConfirmationStatsDto(rows.size(), confirmed, rows.size() - confirmed);

        return new CopayConfirmationRowsResponse(query.year(), query.month(), rows, stats);
    }

    private CopayMonthSummaryResponse emptyMonthSummary(int year) {
        List<CopayMonthSummaryItemDto> months = new ArrayList<>(12);
        for (int month = 1; month <= 12; month++) {
            months.add(new CopayMonthSummaryItemDto(month, 0, 0));
        }
        return new CopayMonthSummaryResponse(year, months);
    }

    private Map<Long, Recipient> loadActiveRecipients(String facilityId, String nameQuery) {
        return comRecipientRepository.findByFacilityId(facilityId, nameQuery).stream()
                .filter(recipient -> ACTIVE_CONTRACT.equals(recipient.getContractStatus()))
                .collect(Collectors.toMap(
                        Recipient::getId, recipient -> recipient, (a, b) -> a, LinkedHashMap::new));
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

    private Map<Long, Integer> loadNonBenefitTotals(java.util.Set<Long> recipientIds, int year, int month) {
        if (recipientIds.isEmpty()) {
            return Map.of();
        }
        List<NonBenefitCharge> charges = nonBenefitChargeRepository.findByRecipientIdInAndServiceYearAndServiceMonth(
                new ArrayList<>(recipientIds), year, month);
        if (charges.isEmpty()) {
            return Map.of();
        }

        List<Long> chargeIds = charges.stream().map(NonBenefitCharge::getId).toList();
        Map<Long, Integer> otherSumByChargeId = nonBenefitOtherItemRepository.findByNonBenefitIdIn(chargeIds).stream()
                .collect(Collectors.groupingBy(
                        NonBenefitOtherItem::getNonBenefitId,
                        Collectors.summingInt(NonBenefitOtherItem::getAmount)));

        Map<Long, Integer> totals = new HashMap<>();
        for (NonBenefitCharge charge : charges) {
            int fixed = charge.getMealAmount() + charge.getRoomAmount() + charge.getBeautyAmount();
            int other = otherSumByChargeId.getOrDefault(charge.getId(), 0);
            totals.put(charge.getRecipientId(), fixed + other);
        }
        return totals;
    }

    private int computeLimitExcess(List<ServiceSchedule> monthSchedules, String gradeText, int year) {
        int gradeNum = CopaySegmentAggregator.resolveGradeForLimit(monthSchedules, gradeText);
        int monthlyLimit = referenceBenefitLimitService.lookupLimit(year, gradeNum);
        int used = CopaySegmentAggregator.sumPlanLimitUsage(monthSchedules);
        return Math.max(0, used - monthlyLimit);
    }

    private static CopayConfirmationRowDto toRowDto(
            Recipient recipient,
            ServiceType serviceType,
            PeriodSegment segment,
            CopayConfirmation confirmation,
            int limitExcess,
            int nonBenefitTotal) {
        return new CopayConfirmationRowDto(
                String.valueOf(recipient.getId()),
                recipient.getName(),
                recipient.getLegalDob().format(ISO_DATE),
                serviceType.name(),
                segment.periodKey(),
                segment.gradeNum(),
                segment.reduction(),
                segment.copayRate().doubleValue(),
                segment.dateFrom().format(ISO_DATE),
                segment.dateTo().format(ISO_DATE),
                segment.plan(),
                segment.claim(),
                toEntryDto(confirmation),
                limitExcess,
                nonBenefitTotal);
    }

    private static CopayConfirmationEntryDto toEntryDto(CopayConfirmation confirmation) {
        if (confirmation == null) {
            return null;
        }
        return new CopayConfirmationEntryDto(
                confirmation.getConfirmType().name(),
                confirmation.getServiceCount(),
                confirmation.getInsuranceAmount(),
                confirmation.getCopayAmount(),
                confirmation.getLimitExcessAmount(),
                confirmation.getConfirmedAt().toString());
    }

    private static Comparator<CopayConfirmationRowDto> rowComparator() {
        return Comparator.comparing(CopayConfirmationRowDto::recipientName, KOREAN)
                .thenComparing(CopayConfirmationRowDto::dateFrom)
                .thenComparing(row -> serviceTypeOrder(row.serviceType()));
    }

    private static int serviceTypeOrder(String serviceType) {
        return switch (ServiceType.valueOf(serviceType)) {
            case visit_care -> 0;
            case visit_bath -> 1;
            case visit_nursing -> 2;
            case day_care -> 3;
            default -> 99;
        };
    }
}
