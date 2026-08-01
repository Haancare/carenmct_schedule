package com.carenmct.schedule.service.importclaim;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalDate;
import java.time.LocalTime;

public record NormalizedClaimRow(
        int sourceRowNo,
        LocalDate serviceDate,
        LocalTime startTime,
        LocalTime endTime,
        int durationMinutes,
        String recipientName,
        String certNo,
        String employeeName,
        LocalDate employeeDob,
        String secondaryEmployeeName,
        LocalDate secondaryEmployeeDob,
        ServiceType serviceType,
        String familyRelation,
        String bathType,
        String feeCode,
        int amount) {}
