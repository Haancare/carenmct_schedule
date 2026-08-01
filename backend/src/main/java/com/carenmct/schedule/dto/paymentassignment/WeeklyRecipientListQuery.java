package com.carenmct.schedule.dto.paymentassignment;

/** GET /api/payment-assignment/weekly/recipients 쿼리 */
public record WeeklyRecipientListQuery(
        int year, String query, String contractStatus, String groupId, String subgroupId) {

    public static final String ALL = "all";

    public String nameQuery() {
        return query == null ? "" : query.trim();
    }

    public String contractStatusFilter() {
        return contractStatus == null || contractStatus.isBlank() ? ALL : contractStatus;
    }

    public String groupIdFilter() {
        return groupId == null || groupId.isBlank() ? ALL : groupId;
    }

    public String subgroupIdFilter() {
        return subgroupId == null || subgroupId.isBlank() ? ALL : subgroupId;
    }
}
