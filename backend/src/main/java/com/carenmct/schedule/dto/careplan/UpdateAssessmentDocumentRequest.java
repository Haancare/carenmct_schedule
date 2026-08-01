package com.carenmct.schedule.dto.careplan;

import java.util.Map;

public record UpdateAssessmentDocumentRequest(
        String writtenDate, Long employeeId, Map<String, Object> formData) {}
