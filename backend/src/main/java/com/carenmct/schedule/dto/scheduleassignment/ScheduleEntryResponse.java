package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.math.BigDecimal;

public record ScheduleEntryResponse(
        Long id,
        String recipientId,
        String employeeId,
        String serviceDate,
        ServiceType serviceType,
        ScheduleKind scheduleKind,
        String startTime,
        String endTime,
        int durationMinutes,
        int unitCost,
        int surchargeAmount,
        Integer benefitTotal,
        boolean feeEdited,
        String feeCode,
        String familyRelation,
        String gradeSnapshot,
        String reductionSnapshot,
        BigDecimal copayRateSnapshot) {}
