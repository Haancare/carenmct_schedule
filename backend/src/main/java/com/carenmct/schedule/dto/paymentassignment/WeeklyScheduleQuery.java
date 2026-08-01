package com.carenmct.schedule.dto.paymentassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;

/** GET /api/payment-assignment/weekly 쿼리 */
public record WeeklyScheduleQuery(String recipientId, int year, ScheduleKind scheduleKind) {}
