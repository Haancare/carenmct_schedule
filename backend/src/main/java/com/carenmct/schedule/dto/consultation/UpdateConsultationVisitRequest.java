package com.carenmct.schedule.dto.consultation;

import com.carenmct.schedule.domain.schedule.enums.ConsultStatus;
import com.carenmct.schedule.domain.schedule.enums.ConsultType;

public record UpdateConsultationVisitRequest(
        ConsultStatus consultStatus,
        ConsultType consultType,
        String plannedStartTime,
        String plannedEndTime,
        String actualStartTime,
        String actualEndTime,
        String notes) {}
