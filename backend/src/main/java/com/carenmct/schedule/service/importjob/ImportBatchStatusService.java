package com.carenmct.schedule.service.importjob;

import com.carenmct.schedule.domain.schedule.ImportBatch;
import com.carenmct.schedule.dto.importplan.PlanScheduleImportResponse;
import com.carenmct.schedule.repository.schedule.ImportBatchRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ImportBatchStatusService {

    private final ImportBatchRepository importBatchRepository;
    private final FacilityScopeResolver facilityScope;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public PlanScheduleImportResponse getBatch(Long batchId) {
        String facilityId = facilityScope.requireFacilityId();
        ImportBatch batch = importBatchRepository
                .findById(batchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "가져오기 배치를 찾을 수 없습니다."));
        if (!facilityId.equals(batch.getFacilityId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "가져오기 배치를 찾을 수 없습니다.");
        }
        ImportBatchLogPayload log = parseLog(batch.getErrorLog());
        return new PlanScheduleImportResponse(
                batch.getId(),
                batch.getStatus(),
                batch.getTotalRows() != null ? batch.getTotalRows() : 0,
                batch.getSuccessRows() != null ? batch.getSuccessRows() : 0,
                log.skippedRows(),
                batch.getErrorRows() != null ? batch.getErrorRows() : 0,
                log.errors());
    }

    private ImportBatchLogPayload parseLog(String errorLog) {
        if (errorLog == null || errorLog.isBlank()) {
            return new ImportBatchLogPayload(0, List.of());
        }
        try {
            if (errorLog.trim().startsWith("[")) {
                List<String> errors = objectMapper.readValue(
                        errorLog,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
                return new ImportBatchLogPayload(0, errors);
            }
            return objectMapper.readValue(errorLog, ImportBatchLogPayload.class);
        } catch (Exception ex) {
            return new ImportBatchLogPayload(0, List.of(errorLog));
        }
    }
}
