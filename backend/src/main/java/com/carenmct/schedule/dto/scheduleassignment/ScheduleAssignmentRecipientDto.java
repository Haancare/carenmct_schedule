package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.util.List;

public record ScheduleAssignmentRecipientDto(
        String id,
        String name,
        String legalDob,
        String gradeText,
        String reduction,
        String certNo,
        String contractStatus,
        List<String> assignedCareWorkerIds,
        boolean hasSchedulesInYear,
        List<ServiceType> serviceTypesInYear,
        String validFrom,
        String validTo,
        String mobile,
        List<ServiceType> serviceTypes,
        List<ScheduleAssignmentContactDto> contacts) {}
