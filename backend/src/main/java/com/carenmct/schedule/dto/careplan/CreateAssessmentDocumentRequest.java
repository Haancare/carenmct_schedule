package com.carenmct.schedule.dto.careplan;

import com.carenmct.schedule.domain.schedule.enums.AssessmentDocType;
import java.util.Map;

public record CreateAssessmentDocumentRequest(
        String recipientId,
        AssessmentDocType docType,
        String writtenDate,
        Long employeeId,
        Map<String, Object> formData) {}
