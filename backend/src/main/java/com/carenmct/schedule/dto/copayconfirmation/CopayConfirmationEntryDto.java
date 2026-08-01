package com.carenmct.schedule.dto.copayconfirmation;

public record CopayConfirmationEntryDto(
        String type,
        int count,
        int insuranceAmount,
        int copayAmount,
        int limitExcessAmount,
        String confirmedAt) {}
