package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateItem;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateServiceHeader;
import com.carenmct.schedule.repository.schedule.reference.AnnualFeeRateServiceHeaderRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
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
@Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
public class ScheduleFeeCalculator {

    private static final int FULL_DAY_MIN_MINUTES = 720;
    /** 방문요양 수가 조회 상한 — 초과 분은 240분 단위로 분할 */
    static final int VISIT_CARE_MAX_CHUNK_MINUTES = 240;

    private static final Map<String, String> BATH_TYPE_TO_FEE_CODE =
            Map.of(
                    "차량이용(차량내)", "나-1",
                    "차량이용(가정내)", "나-2",
                    "차량미이용", "나-3");

    private final AnnualFeeRateServiceHeaderRepository feeRateHeaderRepository;

    public ScheduleFeeQuote calculate(
            int year, ServiceType serviceType, int durationMinutes, String gradeSnapshot, String bathType) {
        return calculate(year, serviceType, durationMinutes, gradeSnapshot, bathType, null);
    }

    /** headerCache가 있으면 요청 단위로 수가 헤더를 재사용한다. */
    public ScheduleFeeQuote calculate(
            int year,
            ServiceType serviceType,
            int durationMinutes,
            String gradeSnapshot,
            String bathType,
            FeeHeaderCache headerCache) {
        AnnualFeeRateServiceHeader header = resolveHeader(year, serviceType, headerCache);
        int gradeNum = ReferenceFeeRateService.parseGradeNum(gradeSnapshot);

        return switch (serviceType) {
            case visit_bath -> calculateVisitBath(header, durationMinutes, gradeNum, bathType);
            case full_day_visit -> calculateFullDayVisit(header, durationMinutes, gradeNum);
            case visit_care -> calculateVisitCare(header, durationMinutes, gradeNum);
            default -> calculateByDuration(header, durationMinutes, gradeNum);
        };
    }

    private AnnualFeeRateServiceHeader resolveHeader(
            int year, ServiceType serviceType, FeeHeaderCache headerCache) {
        if (headerCache == null) {
            return feeRateHeaderRepository
                    .findWithItemsByYearAndServiceType(year, serviceType)
                    .orElseThrow(() -> feeRateNotFound(year, serviceType));
        }
        return headerCache.computeIfAbsent(year, serviceType, () -> feeRateHeaderRepository
                .findWithItemsByYearAndServiceType(year, serviceType)
                .orElseThrow(() -> feeRateNotFound(year, serviceType)));
    }

    /** import/bulk 등 동일 요청 내 수가 헤더 재사용 */
    public static final class FeeHeaderCache {
        private final Map<String, AnnualFeeRateServiceHeader> headers = new HashMap<>();

        AnnualFeeRateServiceHeader computeIfAbsent(
                int year, ServiceType serviceType, java.util.function.Supplier<AnnualFeeRateServiceHeader> loader) {
            String key = year + "|" + serviceType.name();
            return headers.computeIfAbsent(key, ignored -> loader.get());
        }
    }

    private ScheduleFeeQuote calculateVisitCare(
            AnnualFeeRateServiceHeader header, int durationMinutes, int gradeNum) {
        List<Integer> parts = splitVisitCareDurations(durationMinutes);
        if (parts.isEmpty()) {
            throw invalidDuration(ServiceType.visit_care, durationMinutes);
        }

        List<FeeChunk> chunks = new ArrayList<>(parts.size());
        int totalCost = 0;
        for (int partMinutes : parts) {
            ScheduleFeeQuote part = calculateByDuration(header, partMinutes, gradeNum);
            chunks.add(new FeeChunk(
                    partMinutes, part.unitCost(), part.feeCode(), part.feeItemMinMinutes()));
            totalCost += part.unitCost();
        }

        FeeChunk first = chunks.get(0);
        return new ScheduleFeeQuote(totalCost, first.feeCode(), first.feeItemMinMinutes(), chunks);
    }

    /**
     * 방문요양 제공시간을 240분 이하 구간으로 분할한다.
     * 예: 330 → [240, 90], 480 → [240, 240], 510 → [240, 240, 30]
     */
    static List<Integer> splitVisitCareDurations(int durationMinutes) {
        if (durationMinutes <= 0) {
            return List.of();
        }
        List<Integer> parts = new ArrayList<>();
        int remaining = durationMinutes;
        while (remaining > VISIT_CARE_MAX_CHUNK_MINUTES) {
            parts.add(VISIT_CARE_MAX_CHUNK_MINUTES);
            remaining -= VISIT_CARE_MAX_CHUNK_MINUTES;
        }
        if (remaining > 0) {
            parts.add(remaining);
        }
        return parts;
    }

    private ScheduleFeeQuote calculateByDuration(
            AnnualFeeRateServiceHeader header, int durationMinutes, int gradeNum) {
        AnnualFeeRateItem item = findItemByDuration(header, durationMinutes);
        if (item == null) {
            throw invalidDuration(header.getServiceType(), durationMinutes);
        }
        int unitCost = applyPartialRule(header, durationMinutes, item.resolveAmount(gradeNum));
        return ScheduleFeeQuote.single(
                durationMinutes, unitCost, item.getFeeCode(), item.getMinMinutes());
    }

    private ScheduleFeeQuote calculateVisitBath(
            AnnualFeeRateServiceHeader header, int durationMinutes, int gradeNum, String bathType) {
        if (!StringUtils.hasText(bathType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문목욕은 목욕유형(bathType)이 필요합니다.");
        }
        String feeCode = BATH_TYPE_TO_FEE_CODE.get(bathType.trim());
        if (feeCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 목욕유형입니다: " + bathType);
        }

        AnnualFeeRateItem item = header.getItems().stream()
                .filter(i -> feeCode.equals(i.getFeeCode()))
                .findFirst()
                .orElseThrow(() -> feeRateNotFound(header.getBenefitYear(), ServiceType.visit_bath));

        int base = item.resolveAmount(gradeNum);
        if (durationMinutes < item.getMinMinutes()) {
            int unitCost = applyPartialRule(header, durationMinutes, base);
            if (unitCost <= 0) {
                throw invalidDuration(ServiceType.visit_bath, durationMinutes);
            }
            return ScheduleFeeQuote.single(durationMinutes, unitCost, feeCode, item.getMinMinutes());
        }
        return ScheduleFeeQuote.single(durationMinutes, base, feeCode, item.getMinMinutes());
    }

    private ScheduleFeeQuote calculateFullDayVisit(
            AnnualFeeRateServiceHeader header, int durationMinutes, int gradeNum) {
        if (durationMinutes < FULL_DAY_MIN_MINUTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "종일방문은 12시간(720분) 이상 제공해야 합니다.");
        }
        AnnualFeeRateItem item = header.getItems().stream().findFirst().orElse(null);
        if (item == null) {
            throw feeRateNotFound(header.getBenefitYear(), ServiceType.full_day_visit);
        }
        return ScheduleFeeQuote.single(
                durationMinutes,
                item.resolveAmount(gradeNum),
                item.getFeeCode(),
                item.getMinMinutes());
    }

    private AnnualFeeRateItem findItemByDuration(AnnualFeeRateServiceHeader header, int durationMinutes) {
        for (AnnualFeeRateItem item : header.getItems()) {
            if (item.matchesDuration(durationMinutes)) {
                return item;
            }
        }
        return null;
    }

    private int applyPartialRule(AnnualFeeRateServiceHeader header, int durationMinutes, int base) {
        Integer partialMin = header.getPartialMinMinutes();
        Integer partialMax = header.getPartialMaxMinutes();
        BigDecimal partialRate = header.getPartialRate();
        if (partialMin == null || partialMax == null || partialRate == null) {
            return base;
        }
        if (durationMinutes >= partialMin && durationMinutes < partialMax) {
            double value = base * partialRate.doubleValue();
            return (int) (Math.ceil(value / 10.0) * 10);
        }
        return base;
    }

    private static ResponseStatusException feeRateNotFound(int year, ServiceType serviceType) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                year + "년 " + serviceType + " 수가 기준이 없습니다. 연도별 수가를 등록해 주세요.");
    }

    private static ResponseStatusException invalidDuration(ServiceType serviceType, int durationMinutes) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                serviceType + " 제공시간(" + durationMinutes + "분)에 맞는 수가 항목이 없습니다.");
    }

    public record FeeChunk(int durationMinutes, int unitCost, String feeCode, int feeItemMinMinutes) {}

    public record ScheduleFeeQuote(
            int unitCost, String feeCode, int feeItemMinMinutes, List<FeeChunk> chunks) {

        public ScheduleFeeQuote {
            chunks = chunks == null ? List.of() : List.copyOf(chunks);
        }

        static ScheduleFeeQuote single(
                int durationMinutes, int unitCost, String feeCode, int feeItemMinMinutes) {
            return new ScheduleFeeQuote(
                    unitCost,
                    feeCode,
                    feeItemMinMinutes,
                    List.of(new FeeChunk(durationMinutes, unitCost, feeCode, feeItemMinMinutes)));
        }
    }
}
