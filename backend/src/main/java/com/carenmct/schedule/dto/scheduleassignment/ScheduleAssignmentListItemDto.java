package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;

public record ScheduleAssignmentListItemDto(
        PaymentAssignmentRecipientDto recipient, int planCount, int claimCount) {}
