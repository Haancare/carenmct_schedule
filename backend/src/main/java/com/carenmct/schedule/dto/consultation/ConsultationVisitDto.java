package com.carenmct.schedule.dto.consultation;

import com.carenmct.schedule.domain.schedule.enums.ConsultStatus;
import com.carenmct.schedule.domain.schedule.enums.ConsultType;

public record ConsultationVisitDto(
        String id,
        String employeeId,
        String employeeName,
        String recipientId,
        String date,
        ConsultStatus consultStatus,
        ConsultType consultType,
        String plannedStartTime,
        String plannedEndTime,
        String actualStartTime,
        String actualEndTime,
        String notes,
        boolean hasJournal,
        String journalId,
        String journalStatus) {}
