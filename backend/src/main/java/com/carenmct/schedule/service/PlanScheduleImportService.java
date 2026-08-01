package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Employee;
import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ImportBatch;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.repository.com.ComEmployeeRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ImportBatchRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.security.UserScope;
import com.carenmct.schedule.service.copay.CopayAmountCalculator;
import com.carenmct.schedule.service.importjob.ImportBatchLogPayload;
import com.carenmct.schedule.service.importjob.ImportLockService;
import com.carenmct.schedule.service.importplan.NormalizedPlanRow;
import com.carenmct.schedule.service.importplan.PlanScheduleExcelParser;
import com.carenmct.schedule.service.importplan.PlanScheduleRowNormalizer;
import com.carenmct.schedule.service.importplan.RawPlanExcelRow;
import com.carenmct.schedule.support.ScheduleServiceTypeValidator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
public class PlanScheduleImportService {

    public static final String IMPORT_TYPE = "plan_schedule";
    private static final int MAX_ERRORS_IN_RESPONSE = 50;
    private static final int CHUNK_SIZE = 200;

    private final FacilityScopeResolver facilityScope;
    private final PlanScheduleExcelParser excelParser;
    private final PlanScheduleRowNormalizer rowNormalizer;
    private final ImportBatchRepository importBatchRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final ComRecipientRepository recipientRepository;
    private final ComEmployeeRepository employeeRepository;
    private final ScheduleFeeCalculator scheduleFeeCalculator;
    private final ScheduleSurchargeCalculator scheduleSurchargeCalculator;
    private final HolidayService holidayService;
    private final ImportLockService importLockService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate scheduleTx;

    public PlanScheduleImportService(
            FacilityScopeResolver facilityScope,
            PlanScheduleExcelParser excelParser,
            PlanScheduleRowNormalizer rowNormalizer,
            ImportBatchRepository importBatchRepository,
            ServiceScheduleRepository serviceScheduleRepository,
            ComRecipientRepository recipientRepository,
            ComEmployeeRepository employeeRepository,
            ScheduleFeeCalculator scheduleFeeCalculator,
            ScheduleSurchargeCalculator scheduleSurchargeCalculator,
            HolidayService holidayService,
            ImportLockService importLockService,
            ObjectMapper objectMapper,
            @Qualifier("scheduleTransactionTemplate") TransactionTemplate scheduleTx) {
        this.facilityScope = facilityScope;
        this.excelParser = excelParser;
        this.rowNormalizer = rowNormalizer;
        this.importBatchRepository = importBatchRepository;
        this.serviceScheduleRepository = serviceScheduleRepository;
        this.recipientRepository = recipientRepository;
        this.employeeRepository = employeeRepository;
        this.scheduleFeeCalculator = scheduleFeeCalculator;
        this.scheduleSurchargeCalculator = scheduleSurchargeCalculator;
        this.holidayService = holidayService;
        this.importLockService = importLockService;
        this.objectMapper = objectMapper;
        this.scheduleTx = scheduleTx;
    }

    public record AcceptedImport(Long batchId, String facilityId, Long createdBy, Path tempFile) {}

    public AcceptedImport acceptUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "엑셀 파일이 없습니다.");
        }
        String facilityId = facilityScope.requireFacilityId();
        Long createdBy = UserScope.currentUserIdOrNull();

        if (!importLockService.tryLock(facilityId, IMPORT_TYPE, 0)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "해당 기관의 계획 엑셀 가져오기가 이미 진행 중입니다.");
        }

        try {
            Path tempFile = Files.createTempFile("plan-import-", ".xlsx");
            file.transferTo(tempFile);
            ImportBatch batch = scheduleTx.execute(status -> importBatchRepository.save(
                    ImportBatch.start(facilityId, IMPORT_TYPE, createdBy)));
            return new AcceptedImport(batch.getId(), facilityId, createdBy, tempFile);
        } catch (Exception ex) {
            importLockService.unlock(facilityId, IMPORT_TYPE);
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "엑셀 파일을 저장할 수 없습니다: " + ex.getMessage());
        }
    }

    /** 비동기 runner에서 호출 — 락 해제·임시파일 삭제 포함 */
    public void processPlanExcelJob(Long batchId, String facilityId, Long createdBy, Path tempFile) {
        try {
            processPlanExcel(batchId, facilityId, createdBy, tempFile);
        } finally {
            importLockService.unlock(facilityId, IMPORT_TYPE);
            try {
                Files.deleteIfExists(tempFile);
            } catch (Exception ignored) {
                // no-op
            }
        }
    }

    private void processPlanExcel(Long batchId, String facilityId, Long createdBy, Path tempFile) {
        List<String> errors = new ArrayList<>();
        int success = 0;
        int skipped = 0;
        int errorCount = 0;
        int total = 0;

        try (InputStream in = Files.newInputStream(tempFile)) {
            List<RawPlanExcelRow> rawRows = excelParser.parse(in);
            List<NormalizedPlanRow> rows = rowNormalizer.normalize(rawRows);
            total = rows.size();

            LocalDate monthAnchor = rawRows.isEmpty() ? null : rawRows.get(0).serviceDate();
            Integer year = monthAnchor != null ? monthAnchor.getYear() : null;
            Integer month = monthAnchor != null ? monthAnchor.getMonthValue() : null;

            scheduleTx.executeWithoutResult(status -> {
                ImportBatch batch = importBatchRepository
                        .findById(batchId)
                        .orElseThrow(() -> new IllegalStateException("배치 없음"));
                if (year != null) {
                    batch.applyServiceMonth(year, month);
                    serviceScheduleRepository.deleteHardByFacilityKindAndMonth(
                            facilityId, ScheduleKind.plan, year, month);
                }
                importBatchRepository.save(batch);
            });

            Map<String, Recipient> recipientCache = new HashMap<>();
            Map<String, Employee> employeeCache = new HashMap<>();
            ScheduleFeeCalculator.FeeHeaderCache feeHeaderCache = new ScheduleFeeCalculator.FeeHeaderCache();
            int holidayYear = year != null
                    ? year
                    : (rows.isEmpty() ? LocalDate.now().getYear() : rows.get(0).serviceDate().getYear());
            Set<LocalDate> holidayDates = holidayService.holidayDatesForYear(holidayYear);

            List<ServiceSchedule> chunk = new ArrayList<>(CHUNK_SIZE);
            for (NormalizedPlanRow row : rows) {
                try {
                    Recipient recipient = resolveRecipient(facilityId, row, recipientCache);
                    Employee employee =
                            resolveEmployee(facilityId, row.employeeName(), row.employeeDob(), employeeCache);
                    Long secondaryId = null;
                    if (StringUtils.hasText(row.secondaryEmployeeName()) && row.secondaryEmployeeDob() != null) {
                        Employee secondary = resolveEmployee(
                                facilityId,
                                row.secondaryEmployeeName(),
                                row.secondaryEmployeeDob(),
                                employeeCache);
                        secondaryId = secondary.getId();
                    }

                    ScheduleServiceTypeValidator.validate(
                            row.serviceType(), row.durationMinutes(), row.familyRelation());

                    if (serviceScheduleRepository.existsActivePlanDuplicate(
                            facilityId,
                            recipient.getId(),
                            row.serviceDate(),
                            employee.getId(),
                            row.serviceType(),
                            row.startTime(),
                            row.endTime())) {
                        skipped++;
                        continue;
                    }

                    ScheduleFeeCalculator.ScheduleFeeQuote feeQuote = scheduleFeeCalculator.calculate(
                            row.serviceDate().getYear(),
                            row.serviceType(),
                            row.durationMinutes(),
                            recipient.getGrade(),
                            row.bathType(),
                            feeHeaderCache);
                    ScheduleSurchargeCalculator.ScheduleSurchargeQuote surchargeQuote =
                            scheduleSurchargeCalculator.calculateForChunks(
                                    row.serviceType(),
                                    row.serviceDate(),
                                    row.startTime(),
                                    recipient.getGrade(),
                                    feeQuote.chunks(),
                                    holidayDates);

                    BigDecimal copayRate = CopayAmountCalculator.copayRateFromReduction(recipient.getReduction());
                    String externalRef = buildExternalRef(row, employee.getId(), secondaryId);

                    chunk.add(ServiceSchedule.createImport(
                            facilityId,
                            recipient.getId(),
                            employee.getId(),
                            secondaryId,
                            row.serviceDate(),
                            row.serviceType(),
                            row.startTime(),
                            row.endTime(),
                            row.durationMinutes(),
                            feeQuote.unitCost(),
                            feeQuote.feeCode(),
                            surchargeQuote.surchargeAmount(),
                            surchargeQuote.surchargeRate(),
                            surchargeQuote.surchargeMinutes(),
                            recipient.getGrade(),
                            recipient.getReduction(),
                            copayRate,
                            row.bathType(),
                            row.familyRelation(),
                            batchId,
                            externalRef,
                            createdBy));
                    success++;

                    if (chunk.size() >= CHUNK_SIZE) {
                        flushChunk(chunk);
                    }
                } catch (Exception ex) {
                    errorCount++;
                    if (errors.size() < MAX_ERRORS_IN_RESPONSE) {
                        errors.add("행 " + row.sourceRowNo() + ": " + ex.getMessage());
                    }
                }
            }
            flushChunk(chunk);

            String status = resolveStatus(success, skipped, errorCount, total);
            finishBatch(batchId, status, total, success, errorCount, skipped, errors);
        } catch (Exception ex) {
            log.error("Plan import failed batchId={}", batchId, ex);
            String reason = ex.getMessage() != null ? ex.getMessage() : "알 수 없는 오류";
            finishBatch(batchId, "failed", total, success, Math.max(errorCount, 1), skipped, List.of(reason));
        }
    }

    private void flushChunk(List<ServiceSchedule> chunk) {
        if (chunk.isEmpty()) {
            return;
        }
        List<ServiceSchedule> toSave = new ArrayList<>(chunk);
        chunk.clear();
        scheduleTx.executeWithoutResult(status -> serviceScheduleRepository.saveAll(toSave));
    }

    private void finishBatch(
            Long batchId,
            String status,
            int total,
            int success,
            int errorCount,
            int skipped,
            List<String> errors) {
        scheduleTx.executeWithoutResult(tx -> {
            ImportBatch batch = importBatchRepository
                    .findById(batchId)
                    .orElseThrow(() -> new IllegalStateException("배치 없음"));
            batch.finish(status, total, success, errorCount, toJson(new ImportBatchLogPayload(skipped, errors)));
            importBatchRepository.save(batch);
        });
    }

    private Recipient resolveRecipient(
            String facilityId, NormalizedPlanRow row, Map<String, Recipient> cache) {
        String key = row.certNo();
        Recipient cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        Recipient recipient = recipientRepository
                .findFirstByFacility_IdAndCertNo(facilityId, row.certNo())
                .orElseThrow(() -> new IllegalStateException(
                        "수급자를 찾을 수 없습니다 (인정번호: " + row.certNo() + ")"));
        cache.put(key, recipient);
        return recipient;
    }

    private Employee resolveEmployee(
            String facilityId, String name, LocalDate dob, Map<String, Employee> cache) {
        String key = name + "|" + dob;
        Employee cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        Employee employee = employeeRepository
                .findFirstByFacility_IdAndNameAndDobAndDeletedAtIsNull(facilityId, name, dob)
                .orElseThrow(() -> new IllegalStateException(
                        "직원을 찾을 수 없습니다 (" + name + " / " + dob + ")"));
        cache.put(key, employee);
        return employee;
    }

    private static String buildExternalRef(NormalizedPlanRow row, Long employeeId, Long secondaryId) {
        String base = "plan|"
                + row.certNo()
                + "|"
                + row.serviceDate()
                + "|"
                + row.startTime()
                + "|"
                + row.endTime()
                + "|"
                + employeeId;
        if (secondaryId != null) {
            base = base + "|" + secondaryId;
        }
        if (base.length() > 100) {
            return base.substring(0, 100);
        }
        return base;
    }

    private static String resolveStatus(int success, int skipped, int errors, int total) {
        if (total == 0 || (success == 0 && skipped == 0 && errors > 0)) {
            return "failed";
        }
        if (errors > 0) {
            return "partial";
        }
        return "success";
    }

    private String toJson(ImportBatchLogPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return "{\"skippedRows\":0,\"errors\":[]}";
        }
    }
}
