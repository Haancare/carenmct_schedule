package com.carenmct.schedule.dto.consultation;

import com.carenmct.schedule.domain.schedule.enums.JournalStatus;

public record WorkJournalSummaryDto(
        String id,
        String consultationVisitId,
        String recipientId,
        String employeeId,
        JournalStatus journalStatus,
        String writtenDate) {}
