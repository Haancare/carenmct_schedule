package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;

public record RecipientGroupDto(
        String id,
        String name,
        String color,
        boolean hasSubgroups,
        List<RecipientGroupSubgroupDto> subgroups) {}
