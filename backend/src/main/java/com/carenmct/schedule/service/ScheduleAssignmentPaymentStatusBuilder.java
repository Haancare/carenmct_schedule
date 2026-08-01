package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.scheduleassignment.SchedulePaymentStatusDto;
import com.carenmct.schedule.service.copay.CopayAmountCalculator;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class ScheduleAssignmentPaymentStatusBuilder {

    private ScheduleAssignmentPaymentStatusBuilder() {}

    static SchedulePaymentStatusDto build(
            List<ServiceSchedule> monthSchedules,
            ScheduleKind scheduleKind,
            String reduction,
            int monthlyLimit) {
        List<ServiceSchedule> filtered = monthSchedules.stream()
                .filter(schedule -> schedule.getScheduleKind() == scheduleKind)
                .toList();

        int activeUsed = filtered.stream().mapToInt(ScheduleAssignmentPaymentStatusBuilder::benefitTotal).sum();
        int remaining = Math.max(0, monthlyLimit - activeUsed);
        double usageRate =
                monthlyLimit > 0 ? Math.min((activeUsed * 100.0) / monthlyLimit, 100.0) : 0.0;
        int activeSelfPay = CopayAmountCalculator.calcMonthlyCopayTotal(filtered);
        int limitExcess = Math.max(0, activeUsed - monthlyLimit);

        Map<String, Integer> serviceAmounts = new LinkedHashMap<>();
        for (ServiceSchedule schedule : filtered) {
            String label = serviceLabel(schedule.getServiceType());
            serviceAmounts.merge(label, benefitTotal(schedule), Integer::sum);
        }

        List<SchedulePaymentStatusDto.ServiceAmountDto> amounts = new ArrayList<>();
        serviceAmounts.forEach(
                (label, amount) -> amounts.add(new SchedulePaymentStatusDto.ServiceAmountDto(label, amount)));

        return new SchedulePaymentStatusDto(
                monthlyLimit, activeUsed, remaining, usageRate, activeSelfPay, limitExcess, amounts);
    }

    private static int benefitTotal(ServiceSchedule schedule) {
        if (schedule.getBenefitTotal() != null) {
            return schedule.getBenefitTotal();
        }
        return schedule.getUnitCost() + schedule.getSurchargeAmount();
    }

    private static String serviceLabel(ServiceType serviceType) {
        return switch (serviceType) {
            case visit_care -> "방문요양";
            case visit_bath -> "방문목욕";
            case visit_nursing -> "방문간호";
            case day_care -> "주간보호";
            case family_care -> "가족요양";
            case full_day_visit -> "종일방문";
        };
    }
}
