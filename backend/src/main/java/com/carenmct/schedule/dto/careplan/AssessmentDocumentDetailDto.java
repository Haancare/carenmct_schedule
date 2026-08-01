package com.carenmct.schedule.dto.careplan;

import java.util.Map;

public record AssessmentDocumentDetailDto(
        Long id,
        String recipientId,
        String docType,
        String writtenDate,
        Long employeeId,
        String authorName,
        Map<String, Object> formData,
        String createdAt,
        String updatedAt) {}
