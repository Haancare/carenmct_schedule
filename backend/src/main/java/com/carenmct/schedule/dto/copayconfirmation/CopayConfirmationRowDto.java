package com.carenmct.schedule.dto.copayconfirmation;

public record CopayConfirmationRowDto(
        String recipientId,
        String recipientName,
        String legalDob,
        String serviceType,
        String periodKey,
        int gradeNum,
        String reduction,
        double copaymentRate,
        String dateFrom,
        String dateTo,
        CopayAmountsDto plan,
        CopayAmountsDto claim,
        CopayConfirmationEntryDto confirmation,
        int limitExcess,
        int nonBenefitTotal) {}
