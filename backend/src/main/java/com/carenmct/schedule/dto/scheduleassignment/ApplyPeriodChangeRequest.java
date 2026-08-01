package com.carenmct.schedule.dto.scheduleassignment;

public record ApplyPeriodChangeRequest(
        String recipientId,
        int year,
        int month,
        String splitDate,
        String kind,
        String before,
        String after) {}
