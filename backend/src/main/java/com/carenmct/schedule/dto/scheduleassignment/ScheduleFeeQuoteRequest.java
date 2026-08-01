package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public record ScheduleFeeQuoteRequest(
        int year,
        ServiceType serviceType,
        String serviceDate,
        String startTime,
        String endTime,
        int durationMinutes,
        String gradeSnapshot,
        String bathType,
        String familyRelation) {}
