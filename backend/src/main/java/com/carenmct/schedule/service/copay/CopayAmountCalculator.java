package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.dto.copayconfirmation.CopayAmountsDto;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Figma CopaymentConfirmation · getSchedulePeriods 금액 계산 (십원 절사) */
public final class CopayAmountCalculator {

    private CopayAmountCalculator() {}

    static int benefitTotal(ServiceSchedule schedule) {
        if (schedule.getBenefitTotal() != null) {
            return schedule.getBenefitTotal();
        }
        return schedule.getUnitCost() + schedule.getSurchargeAmount();
    }

    static CopayAmountsDto calcAmounts(List<ServiceSchedule> schedules, BigDecimal copayRatePercent) {
        if (schedules.isEmpty()) {
            return CopayAmountsDto.empty();
        }
        int total = schedules.stream().mapToInt(CopayAmountCalculator::benefitTotal).sum();
        int copay = calcCopayFromBenefit(total, copayRatePercent);
        int insurance = total - copay;
        return new CopayAmountsDto(schedules.size(), total, insurance, copay);
    }

    /** 등급·감경·급여유형·종류 그룹별 월 합산 후 십원 절사 본인부담금 합계 */
    public static int calcMonthlyCopayTotal(List<ServiceSchedule> schedules) {
        if (schedules.isEmpty()) {
            return 0;
        }
        Map<String, List<ServiceSchedule>> groups = new LinkedHashMap<>();
        for (ServiceSchedule schedule : schedules) {
            groups.computeIfAbsent(copayGroupKey(schedule), ignored -> new ArrayList<>())
                    .add(schedule);
        }
        int sum = 0;
        for (List<ServiceSchedule> group : groups.values()) {
            BigDecimal rate = resolveCopayRate(group.get(0));
            int totalBenefit = group.stream().mapToInt(CopayAmountCalculator::benefitTotal).sum();
            sum += calcCopayFromBenefit(totalBenefit, rate);
        }
        return sum;
    }

    static int calcCopayFromBenefit(int totalBenefit, BigDecimal copayRatePercent) {
        if (totalBenefit <= 0) {
            return 0;
        }
        double rate = copayRatePercent != null ? copayRatePercent.doubleValue() : 15.0;
        return (int) Math.floor(totalBenefit * rate / 1000.0) * 10;
    }

    public static BigDecimal copayRateFromReduction(String reduction) {
        if (reduction == null) {
            return new BigDecimal("15.00");
        }
        if (reduction.contains("9")) {
            return new BigDecimal("9.00");
        }
        if (reduction.contains("7.5")) {
            return new BigDecimal("7.50");
        }
        if (reduction.contains("6")) {
            return new BigDecimal("6.00");
        }
        if (reduction.contains("기초")) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal("15.00");
    }

    private static String copayGroupKey(ServiceSchedule schedule) {
        String grade = schedule.getGradeSnapshot() != null ? schedule.getGradeSnapshot() : "";
        String reduction =
                schedule.getReductionSnapshot() != null ? schedule.getReductionSnapshot() : "";
        String rate =
                schedule.getCopayRateSnapshot() != null
                        ? schedule.getCopayRateSnapshot().toPlainString()
                        : "";
        return schedule.getServiceType()
                + "|"
                + schedule.getScheduleKind()
                + "|"
                + grade
                + "|"
                + reduction
                + "|"
                + rate;
    }

    private static BigDecimal resolveCopayRate(ServiceSchedule schedule) {
        if (schedule.getCopayRateSnapshot() != null) {
            return schedule.getCopayRateSnapshot();
        }
        return copayRateFromReduction(schedule.getReductionSnapshot());
    }
}
