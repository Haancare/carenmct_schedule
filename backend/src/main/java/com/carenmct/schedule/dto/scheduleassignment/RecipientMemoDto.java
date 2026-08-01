package com.carenmct.schedule.dto.scheduleassignment;

public record RecipientMemoDto(
        String id,
        String content,
        String timestamp,
        String authorName,
        String serviceMonth,
        boolean pinned) {}
