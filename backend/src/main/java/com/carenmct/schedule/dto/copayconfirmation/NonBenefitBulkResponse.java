package com.carenmct.schedule.dto.copayconfirmation;

import java.util.List;
import java.util.Map;

public record NonBenefitBulkResponse(
        int year,
        int month,
        List<String> facilityOtherCategories,
        List<NonBenefitRecipientEntryDto> entries) {}
