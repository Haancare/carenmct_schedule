package com.carenmct.schedule.dto.paymentassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaymentAssignmentRecipientDto(
        String id,
        String name,
        String legalDob,
        String gradeText,
        String reduction,
        String certNo,
        String contractStatus,
        List<String> assignedCareWorkerIds,
        boolean hasSchedulesInYear,
        List<ServiceType> serviceTypesInYear) {}
