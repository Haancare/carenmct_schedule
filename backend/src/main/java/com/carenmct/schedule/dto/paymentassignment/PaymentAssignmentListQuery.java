package com.carenmct.schedule.dto.paymentassignment;

/** GET /api/payment-assignment/recipients | /annual 공통 쿼리 */
public record PaymentAssignmentListQuery(
        int year,
        String query,
        String grade,
        String reductionType,
        String serviceType,
        String workerId,
        Boolean showAllActive,
        String groupId,
        String subgroupId) {

    public static final String ALL = "all";

    public String nameQuery() {
        return query == null ? "" : query.trim();
    }

    public String gradeFilter() {
        return grade == null || grade.isBlank() ? ALL : grade;
    }

    public String reductionTypeFilter() {
        return reductionType == null || reductionType.isBlank() ? ALL : reductionType;
    }

    public String serviceTypeFilter() {
        return serviceType == null || serviceType.isBlank() ? ALL : serviceType;
    }

    public String workerIdFilter() {
        return workerId == null || workerId.isBlank() ? ALL : workerId;
    }

    public String groupIdFilter() {
        return groupId == null || groupId.isBlank() ? ALL : groupId;
    }

    public String subgroupIdFilter() {
        return subgroupId == null || subgroupId.isBlank() ? ALL : subgroupId;
    }

    public boolean showAllActiveRecipients() {
        return showAllActive == null || showAllActive;
    }
}
