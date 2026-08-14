package com.carenmct.schedule.dto.scheduleassignment;

public record RecipientFamilyWorkerDto(
        String employeeId,
        String employeeName,
        String familyRelation,
        boolean selfCopayDeduction) {}
