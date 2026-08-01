package com.carenmct.schedule.service.importjob;

import com.carenmct.schedule.service.PlanScheduleImportService;
import java.nio.file.Path;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PlanScheduleImportAsyncRunner {

    private final PlanScheduleImportService planScheduleImportService;

    @Async("scheduleImportExecutor")
    public void run(Long batchId, String facilityId, Long createdBy, Path tempFile) {
        planScheduleImportService.processPlanExcelJob(batchId, facilityId, createdBy, tempFile);
    }
}
