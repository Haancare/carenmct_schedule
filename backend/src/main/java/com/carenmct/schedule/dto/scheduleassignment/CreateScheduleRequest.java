package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.math.BigDecimal;

public record CreateScheduleRequest(
        String recipientId,
        String employeeId,
        String serviceDate,
        ServiceType serviceType,
        ScheduleKind scheduleKind,
        String startTime,
        String endTime,
        int durationMinutes,
        Integer unitCost,
        String gradeSnapshot,
        String reductionSnapshot,
        BigDecimal copayRateSnapshot,
        String bathType,
        String familyRelation) {}
