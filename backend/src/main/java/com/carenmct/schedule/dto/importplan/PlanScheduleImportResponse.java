package com.carenmct.schedule.dto.importplan;

import java.util.List;

public record PlanScheduleImportResponse(
        Long batchId,
        String status,
        int totalRows,
        int successRows,
        int skippedRows,
        int errorRows,
        List<String> errors) {}
