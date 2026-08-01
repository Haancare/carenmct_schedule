package com.carenmct.schedule.dto.scheduleassignment;

import java.util.List;

public record ScheduleAssignmentMonthResponse(
        ScheduleAssignmentRecipientDto recipient,
        List<ScheduleEntryResponse> schedules,
        SchedulePaymentStatusDto paymentStatus) {}
