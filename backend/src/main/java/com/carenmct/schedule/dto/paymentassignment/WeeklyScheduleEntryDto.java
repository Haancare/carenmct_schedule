package com.carenmct.schedule.dto.paymentassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.math.BigDecimal;

public record WeeklyScheduleEntryDto(
        String date,
        ServiceType serviceType,
        ScheduleKind scheduleKind,
        String startTime,
        String endTime,
        int durationMinutes,
        String careWorkerId,
        Long scheduleId,
        Integer unitCost,
        Integer surchargeAmount,
        Integer benefitTotal,
        String gradeSnapshot,
        String reductionSnapshot,
        BigDecimal copayRateSnapshot) {}
