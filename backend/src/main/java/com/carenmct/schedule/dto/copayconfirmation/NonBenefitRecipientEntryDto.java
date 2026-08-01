package com.carenmct.schedule.dto.copayconfirmation;

import java.util.Map;

public record NonBenefitRecipientEntryDto(
        String recipientId,
        String recipientName,
        String gradeText,
        int meal,
        int room,
        int beauty,
        Map<String, Integer> otherAmounts,
        int total) {}
