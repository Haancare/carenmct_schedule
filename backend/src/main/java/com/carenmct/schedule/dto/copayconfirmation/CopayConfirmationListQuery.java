package com.carenmct.schedule.dto.copayconfirmation;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public record CopayConfirmationListQuery(
        int year, int month, String nameQuery, StatusFilter statusFilter, ServiceType serviceTypeFilter) {

    public static final String ALL = "all";

    public enum StatusFilter {
        all,
        unconfirmed,
        plan,
        claim,
        manual
    }

    public static StatusFilter parseStatus(String raw) {
        if (raw == null || raw.isBlank() || ALL.equalsIgnoreCase(raw)) {
            return StatusFilter.all;
        }
        try {
            return StatusFilter.valueOf(raw.toLowerCase());
        } catch (IllegalArgumentException ex) {
            return StatusFilter.all;
        }
    }

    public static ServiceType parseServiceType(String raw) {
        if (raw == null || raw.isBlank() || ALL.equalsIgnoreCase(raw)) {
            return null;
        }
        return ServiceType.valueOf(raw);
    }
}
