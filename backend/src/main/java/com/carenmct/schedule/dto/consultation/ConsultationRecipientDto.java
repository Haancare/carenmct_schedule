package com.carenmct.schedule.dto.consultation;

import java.util.List;

public record ConsultationRecipientDto(
        String id,
        String name,
        String gradeText,
        String reduction,
        String certNo,
        String contractStatus,
        String legalDob,
        String mobile,
        String address,
        String guardianName,
        String guardianPhone,
        List<String> serviceTypes,
        boolean hasSchedulesInMonth) {}
