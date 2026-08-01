package com.carenmct.schedule.dto.session;

import java.util.List;

public record CurrentFacilityDto(
        String id,
        String name,
        String alias,
        String code,
        String category,
        List<String> subCategories,
        String uniqueNum) {}
