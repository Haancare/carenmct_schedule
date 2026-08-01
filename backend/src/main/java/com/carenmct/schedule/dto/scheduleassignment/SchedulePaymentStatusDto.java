package com.carenmct.schedule.dto.scheduleassignment;

import java.util.List;

public record SchedulePaymentStatusDto(
        int monthlyLimit,
        int activeUsed,
        int remaining,
        double usageRate,
        int activeSelfPay,
        int limitExcess,
        List<ServiceAmountDto> serviceAmounts) {

    public record ServiceAmountDto(String label, int amount) {}
}
