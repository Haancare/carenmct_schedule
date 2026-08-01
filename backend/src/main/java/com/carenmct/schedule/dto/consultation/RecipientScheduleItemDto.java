package com.carenmct.schedule.dto.consultation;

public record RecipientScheduleItemDto(
        String id,
        String serviceDate,
        String serviceType,
        String scheduleKind,
        String startTime,
        String endTime,
        int durationMinutes,
        String employeeId,
        String employeeName) {}
