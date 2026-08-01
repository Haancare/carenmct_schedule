package com.carenmct.schedule.service.importplan;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalDate;
import java.time.LocalTime;

/** 엑셀 정규화 후 등록 대상 1건 */
public record NormalizedPlanRow(
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
        String bathType) {}
