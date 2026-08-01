package com.carenmct.schedule.dto.consultation;

import com.carenmct.schedule.domain.schedule.enums.JournalStatus;
import java.util.Map;

public record WorkJournalDetailDto(
        String id,
        String consultationVisitId,
        String recipientId,
        String employeeId,
        JournalStatus journalStatus,
        String writtenDate,
        Map<String, Object> formData) {}
