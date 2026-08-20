package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateItem;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateServiceHeader;
import com.carenmct.schedule.dto.admin.AnnualFeeRateItemDto;
import com.carenmct.schedule.dto.admin.AnnualFeeRatePartialRuleDto;
import com.carenmct.schedule.dto.admin.AnnualFeeRateServiceDto;
import com.carenmct.schedule.dto.admin.AnnualFeeRateYearDto;
import com.carenmct.schedule.dto.admin.UpsertAnnualFeeRateServiceRequest;
import com.carenmct.schedule.dto.admin.UpsertAnnualFeeRateServiceRequest.AnnualFeeRatePartialRuleRequest;
import com.carenmct.schedule.dto.admin.UpsertAnnualFeeRateServiceRequest.UpsertAnnualFeeRateItemRequest;
import com.carenmct.schedule.repository.schedule.reference.AnnualFeeRateServiceHeaderRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAnnualFeeRateService {

    private static final Map<ServiceType, String> SERVICE_LABELS = Map.of(
            ServiceType.visit_care, "방문요양",
            ServiceType.family_care, "가족요양",
            ServiceType.full_day_visit, "종일방문",
            ServiceType.visit_bath, "방문목욕",
            ServiceType.visit_nursing, "방문간호",
            ServiceType.day_care, "주간보호");

    private final AnnualFeeRateServiceHeaderRepository feeRateHeaderRepository;

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<Integer> listYears() {
        return feeRateHeaderRepository.findDistinctBenefitYears();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public AnnualFeeRateYearDto getYear(int year) {
        validateYear(year);
        List<AnnualFeeRateServiceHeader> headers =
                feeRateHeaderRepository.findAllWithItemsByYear(year);
        List<AnnualFeeRateServiceDto> services = headers.stream()
                .sorted(Comparator.comparing(h -> h.getServiceType().name()))
                .map(this::toServiceDto)
                .toList();
        return new AnnualFeeRateYearDto(year, services);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public AnnualFeeRateServiceDto upsertService(
            int year, String serviceTypeCode, UpsertAnnualFeeRateServiceRequest request) {
        validateYear(year);
        ServiceType serviceType = parseServiceType(serviceTypeCode);
        AnnualFeeRateServiceHeader header = feeRateHeaderRepository
                .findWithItemsByYearAndServiceType(year, serviceType)
                .orElseGet(() -> AnnualFeeRateServiceHeader.create(
                        year, serviceType, null, null, null, null));

        applyUpsert(header, request);
        AnnualFeeRateServiceHeader saved = feeRateHeaderRepository.save(header);

        if (serviceType == ServiceType.visit_care) {
            syncFamilyCareFromVisitCare(year, saved);
        }

        return toServiceDto(saved);
    }

    /** 최신 연도 전체 급여유형을 다음 연도로 복제 */
    @Transactional(transactionManager = "scheduleTransactionManager")
    public AnnualFeeRateYearDto createNextYear() {
        List<Integer> years = feeRateHeaderRepository.findDistinctBenefitYears();
        if (years.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "복사할 연도별 수가가 없습니다. 시드 데이터를 먼저 등록하세요.");
        }
        int sourceYear = years.get(0);
        int nextYear = sourceYear + 1;
        if (feeRateHeaderRepository.existsByBenefitYear(nextYear)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Fee rates already exist for year " + nextYear);
        }

        List<AnnualFeeRateServiceHeader> source =
                feeRateHeaderRepository.findAllWithItemsByYear(sourceYear);
        List<AnnualFeeRateServiceHeader> created = new ArrayList<>();
        for (AnnualFeeRateServiceHeader header : source) {
            created.add(feeRateHeaderRepository.save(header.copyToYear(nextYear)));
        }
        List<AnnualFeeRateServiceDto> services = created.stream()
                .sorted(Comparator.comparing(h -> h.getServiceType().name()))
                .map(this::toServiceDto)
                .toList();
        return new AnnualFeeRateYearDto(nextYear, services);
    }

    private void applyUpsert(AnnualFeeRateServiceHeader header, UpsertAnnualFeeRateServiceRequest request) {
        AnnualFeeRatePartialRuleRequest partial = request.partialRule();
        Integer partialMin = partial != null ? partial.minMinutes() : null;
        Integer partialMax = partial != null ? partial.maxMinutes() : null;
        BigDecimal partialRate = partial != null ? partial.rate() : null;

        header.updateMeta(blankToNull(request.note()), partialMin, partialMax, partialRate);

        List<AnnualFeeRateItem> items = new ArrayList<>();
        for (UpsertAnnualFeeRateItemRequest itemReq : request.items()) {
            items.add(toEntityItem(itemReq));
        }
        header.replaceItems(items);
    }

    /** 방문요양 저장 시 applyFamily=true 항목으로 family_care 헤더 동기화 */
    private void syncFamilyCareFromVisitCare(int year, AnnualFeeRateServiceHeader visitCare) {
        List<AnnualFeeRateItem> familyItems = visitCare.getItems().stream()
                .filter(i -> Boolean.TRUE.equals(i.getApplyFamily()))
                .map(AnnualFeeRateItem::copy)
                .toList();

        AnnualFeeRateServiceHeader family = feeRateHeaderRepository
                .findWithItemsByYearAndServiceType(year, ServiceType.family_care)
                .orElseGet(() -> AnnualFeeRateServiceHeader.create(
                        year,
                        ServiceType.family_care,
                        "방문요양 가족요양 적용 항목 동기화",
                        null,
                        null,
                        null));

        family.updateMeta(
                family.getNote() != null ? family.getNote() : "방문요양 가족요양 적용 항목 동기화",
                null,
                null,
                null);
        family.replaceItems(new ArrayList<>(familyItems));
        feeRateHeaderRepository.save(family);
    }

    private AnnualFeeRateItem toEntityItem(UpsertAnnualFeeRateItemRequest req) {
        Map<String, Integer> grades = req.gradeAmounts();
        boolean hasGrades = grades != null && !grades.isEmpty();
        return AnnualFeeRateItem.create(
                req.code().trim(),
                req.label().trim(),
                hasGrades ? (req.amount() != null ? req.amount() : 0) : (req.amount() != null ? req.amount() : 0),
                req.minMinutes() != null ? req.minMinutes() : 0,
                req.maxMinutes(),
                Boolean.TRUE.equals(req.maxInclusive()),
                Boolean.TRUE.equals(req.applyFamily()),
                hasGrades ? grades.get("1") : null,
                hasGrades ? grades.get("2") : null,
                hasGrades ? grades.get("3") : null,
                hasGrades ? grades.get("4") : null,
                hasGrades ? grades.get("5") : null,
                hasGrades ? grades.get("인지지원") : null);
    }

    private AnnualFeeRateServiceDto toServiceDto(AnnualFeeRateServiceHeader header) {
        AnnualFeeRatePartialRuleDto partial = null;
        if (header.getPartialMinMinutes() != null
                && header.getPartialMaxMinutes() != null
                && header.getPartialRate() != null) {
            partial = new AnnualFeeRatePartialRuleDto(
                    header.getPartialMinMinutes(),
                    header.getPartialMaxMinutes(),
                    header.getPartialRate());
        }

        List<AnnualFeeRateItemDto> items = header.getItems().stream()
                .sorted(Comparator.comparing(i -> i.getSortOrder() != null ? i.getSortOrder() : 0))
                .map(this::toItemDto)
                .toList();

        return new AnnualFeeRateServiceDto(
                header.getServiceType().name(),
                SERVICE_LABELS.getOrDefault(header.getServiceType(), header.getServiceType().name()),
                header.getNote(),
                partial,
                items);
    }

    private AnnualFeeRateItemDto toItemDto(AnnualFeeRateItem item) {
        Map<String, Integer> gradeAmounts = null;
        if (item.getGrade1Amount() != null
                || item.getGrade2Amount() != null
                || item.getGrade3Amount() != null
                || item.getGrade4Amount() != null
                || item.getGrade5Amount() != null
                || item.getGradeCognitiveAmount() != null) {
            gradeAmounts = new LinkedHashMap<>();
            gradeAmounts.put("1", item.getGrade1Amount() != null ? item.getGrade1Amount() : 0);
            gradeAmounts.put("2", item.getGrade2Amount() != null ? item.getGrade2Amount() : 0);
            gradeAmounts.put("3", item.getGrade3Amount() != null ? item.getGrade3Amount() : 0);
            gradeAmounts.put("4", item.getGrade4Amount() != null ? item.getGrade4Amount() : 0);
            gradeAmounts.put("5", item.getGrade5Amount() != null ? item.getGrade5Amount() : 0);
            gradeAmounts.put(
                    "인지지원",
                    item.getGradeCognitiveAmount() != null ? item.getGradeCognitiveAmount() : 0);
        }

        return new AnnualFeeRateItemDto(
                item.getFeeCode(),
                item.getLabel(),
                item.getAmount() != null ? item.getAmount() : 0,
                Boolean.TRUE.equals(item.getApplyFamily()),
                item.getMinMinutes(),
                item.getMaxMinutes(),
                Boolean.TRUE.equals(item.getMaxInclusive()),
                gradeAmounts);
    }

    private static ServiceType parseServiceType(String code) {
        try {
            return ServiceType.valueOf(code);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid serviceType: " + code);
        }
    }

    private static void validateYear(int year) {
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid benefit year");
        }
    }

    private static String blankToNull(String note) {
        if (!StringUtils.hasText(note)) {
            return null;
        }
        return note.trim();
    }
}
