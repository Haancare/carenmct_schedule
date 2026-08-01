package com.carenmct.schedule.service.importjob;

import java.util.List;

public record ImportBatchLogPayload(int skippedRows, List<String> errors) {}
