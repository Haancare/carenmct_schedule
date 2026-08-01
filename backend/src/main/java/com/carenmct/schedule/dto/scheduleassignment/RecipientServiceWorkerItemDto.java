package com.carenmct.schedule.dto.scheduleassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public record RecipientServiceWorkerItemDto(
        ServiceType serviceType, Long employeeId, String familyRelation, int sortOrder) {}
