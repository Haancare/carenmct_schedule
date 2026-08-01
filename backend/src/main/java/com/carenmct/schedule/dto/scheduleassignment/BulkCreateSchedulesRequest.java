package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.math.BigDecimal;
import java.util.List;

public record BulkCreateSchedulesRequest(
        String recipientId,
        String employeeId,
        ServiceType serviceType,
        List<String> serviceDates,
        String startTime,
        String endTime,
        int durationMinutes,
        Integer unitCost,
        String gradeSnapshot,
        String reductionSnapshot,
        BigDecimal copayRateSnapshot,
        String bathType,
        String familyRelation) {}
