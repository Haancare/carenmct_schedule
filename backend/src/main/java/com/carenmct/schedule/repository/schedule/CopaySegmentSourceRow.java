package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public record CopaySegmentSourceRow(
        Long recipientId,
        int month,
        ServiceType serviceType,
        String gradeSnapshot,
        String reductionSnapshot) {}
