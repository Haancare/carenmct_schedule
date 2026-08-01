package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.importplan.PlanScheduleImportResponse;
import com.carenmct.schedule.service.ClaimScheduleImportService;
import com.carenmct.schedule.service.PlanScheduleImportService;
import com.carenmct.schedule.service.importjob.ClaimScheduleImportAsyncRunner;
import com.carenmct.schedule.service.importjob.ImportBatchStatusService;
import com.carenmct.schedule.service.importjob.PlanScheduleImportAsyncRunner;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/imports")
@RequiredArgsConstructor
public class PlanScheduleImportController {

    private final PlanScheduleImportService planScheduleImportService;
    private final ClaimScheduleImportService claimScheduleImportService;
    private final PlanScheduleImportAsyncRunner planScheduleImportAsyncRunner;
    private final ClaimScheduleImportAsyncRunner claimScheduleImportAsyncRunner;
    private final ImportBatchStatusService importBatchStatusService;

    @PostMapping(value = "/plan-schedule", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlanScheduleImportResponse> importPlanSchedule(
            @RequestPart("file") MultipartFile file) {
        PlanScheduleImportService.AcceptedImport accepted = planScheduleImportService.acceptUpload(file);
        planScheduleImportAsyncRunner.run(
                accepted.batchId(), accepted.facilityId(), accepted.createdBy(), accepted.tempFile());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new PlanScheduleImportResponse(
                        accepted.batchId(), "running", 0, 0, 0, 0, List.of()));
    }

    @PostMapping(value = "/claim-schedule", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PlanScheduleImportResponse> importClaimSchedule(
            @RequestPart("listFile") MultipartFile listFile,
            @RequestPart("detailFile") MultipartFile detailFile) {
        ClaimScheduleImportService.AcceptedImport accepted =
                claimScheduleImportService.acceptUpload(listFile, detailFile);
        claimScheduleImportAsyncRunner.run(
                accepted.batchId(),
                accepted.facilityId(),
                accepted.createdBy(),
                accepted.listTemp(),
                accepted.detailTemp());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new PlanScheduleImportResponse(
                        accepted.batchId(), "running", 0, 0, 0, 0, List.of()));
    }

    @GetMapping("/batches/{batchId}")
    public PlanScheduleImportResponse getBatch(@PathVariable Long batchId) {
        return importBatchStatusService.getBatch(batchId);
    }
}
