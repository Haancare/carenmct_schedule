package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;

public record AnnualScheduleRowDto(
        PaymentAssignmentRecipientDto recipient, List<MonthScheduleSummaryDto> months) {}
