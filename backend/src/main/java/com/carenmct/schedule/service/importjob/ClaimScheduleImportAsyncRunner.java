package com.carenmct.schedule.service.importjob;

import com.carenmct.schedule.service.ClaimScheduleImportService;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClaimScheduleImportAsyncRunner {

    private final ClaimScheduleImportService claimScheduleImportService;

    @Async("scheduleImportExecutor")
    public void run(Long batchId, String facilityId, Long createdBy, Path listTemp, Path detailTemp) {
        claimScheduleImportService.processClaimExcelJob(batchId, facilityId, createdBy, listTemp, detailTemp);
    }
}
