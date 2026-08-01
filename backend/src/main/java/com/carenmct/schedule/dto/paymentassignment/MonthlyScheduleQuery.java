package com.carenmct.schedule.dto.paymentassignment;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;

/** GET /api/payment-assignment/monthly 쿼리 */
public record MonthlyScheduleQuery(
        int year,
        String query,
        String grade,
        String reductionType,
        String serviceType,
        String workerId,
        Boolean showAllActive,
        String groupId,
        String subgroupId,
        int month,
        ScheduleKind scheduleKind) {

    public PaymentAssignmentListQuery toListQuery() {
        return new PaymentAssignmentListQuery(
                year,
                query,
                grade,
                reductionType,
                serviceType,
                workerId,
                showAllActive,
                groupId,
                subgroupId);
    }
}
