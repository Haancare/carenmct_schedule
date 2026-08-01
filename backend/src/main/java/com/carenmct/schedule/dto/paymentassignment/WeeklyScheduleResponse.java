package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;
import java.util.Map;

public record WeeklyScheduleResponse(
        PaymentAssignmentRecipientDto recipient,
        List<WeeklyCalendarWeekDto> weeks,
        Map<String, List<WeeklyScheduleEntryDto>> entriesByDate,
        Map<String, String> dayMemos) {}
