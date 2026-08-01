package com.carenmct.schedule.dto.careplan;

/** 이력 목록용 (formData 제외) */
public record AssessmentDocumentSummaryDto(
        Long id,
        String recipientId,
        String docType,
        String writtenDate,
        Long employeeId,
        String authorName,
        String createdAt,
        String updatedAt) {}
