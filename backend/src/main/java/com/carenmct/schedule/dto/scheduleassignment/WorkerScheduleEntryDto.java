package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public record WorkerScheduleEntryDto(
        Long id,
        String recipientId,
        String recipientName,
        String serviceDate,
        ServiceType serviceType,
        ScheduleKind scheduleKind,
        String startTime,
        String endTime,
        int durationMinutes) {}
