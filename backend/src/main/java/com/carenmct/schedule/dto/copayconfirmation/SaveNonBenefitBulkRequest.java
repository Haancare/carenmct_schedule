package com.carenmct.schedule.dto.copayconfirmation;

import java.util.List;
import java.util.Map;

public record SaveNonBenefitBulkRequest(int year, int month, List<NonBenefitSaveEntryDto> entries) {

    public record NonBenefitSaveEntryDto(
            String recipientId, int meal, int room, int beauty, Map<String, Integer> otherAmounts) {}
}
