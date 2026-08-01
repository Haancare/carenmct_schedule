package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.copay.CopayPeriodKey;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.copayconfirmation.CopayAmountsDto;
import com.carenmct.schedule.service.ReferenceBenefitLimitService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class CopaySegmentAggregator {

    public static final Set<ServiceType> COPAY_SERVICE_TYPES = EnumSet.of(
            ServiceType.visit_care,
            ServiceType.visit_bath,
            ServiceType.visit_nursing,
            ServiceType.day_care);

    private static final Set<ServiceType> LIMIT_SERVICE_TYPES = EnumSet.of(
            ServiceType.visit_care,
            ServiceType.family_care,
            ServiceType.full_day_visit,
            ServiceType.visit_bath,
            ServiceType.day_care);

    private CopaySegmentAggregator() {}

    public record PeriodSegment(
            String periodKey,
            int gradeNum,
            String reduction,
            BigDecimal copayRate,
            LocalDate dateFrom,
            LocalDate dateTo,
            CopayAmountsDto plan,
            CopayAmountsDto claim) {}

    public record SegmentIdentity(
            long recipientId, int month, ServiceType serviceType, String periodKey) {}

    public static List<PeriodSegment> buildPeriodSegments(
            List<ServiceSchedule> monthSchedules, ServiceType serviceType, Recipient recipient) {
        List<ServiceSchedule> rows = monthSchedules.stream()
                .filter(schedule -> schedule.getServiceType() == serviceType)
                .sorted(Comparator.comparing(ServiceSchedule::getServiceDate)
                        .thenComparing(ServiceSchedule::getStartTime))
                .toList();
        if (rows.isEmpty()) {
            return List.of();
        }

        int fallbackGrade = ReferenceBenefitLimitService.parseGradeNum(
                recipient.getGrade(), recipient.getGrade());
        String fallbackReduction = recipient.getReduction();
        BigDecimal fallbackRate = CopayAmountCalculator.copayRateFromReduction(fallbackReduction);

        Map<String, List<ServiceSchedule>> groups = new LinkedHashMap<>();
        for (ServiceSchedule schedule : rows) {
            int gradeNum = ReferenceBenefitLimitService.parseGradeNum(
                    schedule.getGradeSnapshot(), recipient.getGrade());
            String reduction = schedule.getReductionSnapshot() != null
                            && !schedule.getReductionSnapshot().isBlank()
                    ? schedule.getReductionSnapshot()
                    : fallbackReduction;
            String key = gradeNum + "|" + reduction;
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(schedule);
        }

        List<PeriodSegment> segments = new ArrayList<>();
        groups.forEach((key, schedules) -> {
            String[] parts = key.split("\\|", 2);
            int gradeNum = Integer.parseInt(parts[0]);
            String reduction = parts.length > 1 ? parts[1] : fallbackReduction;
            BigDecimal rate = schedules.get(0).getCopayRateSnapshot() != null
                    ? schedules.get(0).getCopayRateSnapshot()
                    : CopayAmountCalculator.copayRateFromReduction(reduction);
            if (rate == null) {
                rate = fallbackRate;
            }

            LocalDate dateFrom = schedules.stream()
                    .map(ServiceSchedule::getServiceDate)
                    .min(LocalDate::compareTo)
                    .orElseThrow();
            LocalDate dateTo = schedules.stream()
                    .map(ServiceSchedule::getServiceDate)
                    .max(LocalDate::compareTo)
                    .orElseThrow();

            List<ServiceSchedule> planRows = schedules.stream()
                    .filter(schedule -> schedule.getScheduleKind() == ScheduleKind.plan)
                    .toList();
            List<ServiceSchedule> claimRows = schedules.stream()
                    .filter(schedule -> schedule.getScheduleKind() == ScheduleKind.claim)
                    .toList();

            segments.add(new PeriodSegment(
                    CopayPeriodKey.of(gradeNum, reduction),
                    gradeNum,
                    reduction,
                    rate,
                    dateFrom,
                    dateTo,
                    CopayAmountCalculator.calcAmounts(planRows, rate),
                    CopayAmountCalculator.calcAmounts(claimRows, rate)));
        });

        segments.sort(Comparator.comparing(PeriodSegment::dateFrom));
        return segments;
    }

    public static List<SegmentIdentity> collectSegmentIdentities(
            Map<Long, Recipient> activeRecipients,
            Map<Long, List<ServiceSchedule>> schedulesByRecipient,
            int year) {
        List<SegmentIdentity> out = new ArrayList<>();
        schedulesByRecipient.forEach((recipientId, schedules) -> {
            if (!activeRecipients.containsKey(recipientId)) {
                return;
            }
            Map<Integer, List<ServiceSchedule>> byMonth = groupByMonth(schedules, year);
            byMonth.forEach((month, monthSchedules) -> {
                Recipient recipient = activeRecipients.get(recipientId);
                for (ServiceType serviceType : COPAY_SERVICE_TYPES) {
                    for (PeriodSegment segment : buildPeriodSegments(monthSchedules, serviceType, recipient)) {
                        out.add(new SegmentIdentity(recipientId, month, serviceType, segment.periodKey()));
                    }
                }
            });
        });
        return out;
    }

    public static int resolveGradeForLimit(List<ServiceSchedule> monthSchedules, String gradeText) {
        int minGrade = 99;
        for (ServiceSchedule schedule : monthSchedules) {
            if (!LIMIT_SERVICE_TYPES.contains(schedule.getServiceType())) {
                continue;
            }
            int grade = ReferenceBenefitLimitService.parseGradeNum(
                    schedule.getGradeSnapshot(), gradeText);
            if (grade < minGrade) {
                minGrade = grade;
            }
        }
        if (minGrade == 99) {
            return ReferenceBenefitLimitService.parseGradeNum(gradeText, gradeText);
        }
        return minGrade;
    }

    public static int sumPlanLimitUsage(List<ServiceSchedule> monthSchedules) {
        return monthSchedules.stream()
                .filter(schedule -> LIMIT_SERVICE_TYPES.contains(schedule.getServiceType()))
                .filter(schedule -> schedule.getScheduleKind() == ScheduleKind.plan)
                .mapToInt(CopayAmountCalculator::benefitTotal)
                .sum();
    }

    private static Map<Integer, List<ServiceSchedule>> groupByMonth(List<ServiceSchedule> schedules, int year) {
        Map<Integer, List<ServiceSchedule>> byMonth = new LinkedHashMap<>();
        for (ServiceSchedule schedule : schedules) {
            if (schedule.getServiceDate().getYear() != year) {
                continue;
            }
            int month = schedule.getServiceDate().getMonthValue();
            byMonth.computeIfAbsent(month, ignored -> new ArrayList<>()).add(schedule);
        }
        return byMonth;
    }
}
