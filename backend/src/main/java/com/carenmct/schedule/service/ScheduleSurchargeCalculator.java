package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.service.ScheduleFeeCalculator.FeeChunk;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

@Service
@RequiredArgsConstructor
public class ScheduleSurchargeCalculator {

    private static final BigDecimal HOLIDAY_RATE = new BigDecimal("0.5000");
    private static final BigDecimal SUNDAY_RATE = new BigDecimal("0.3000");
    private static final BigDecimal NIGHT_RATE = new BigDecimal("0.3000");
    private static final int MINUTES_PER_DAY = 24 * 60;

    private final HolidayService holidayService;

    public ScheduleSurchargeQuote calculateForChunks(
            ServiceType serviceType,
            LocalDate serviceDate,
            LocalTime startTime,
            String gradeSnapshot,
            List<FeeChunk> chunks) {
        return calculateForChunks(serviceType, serviceDate, startTime, gradeSnapshot, chunks, null);
    }

    /**
     * 수가 구간별로 가산을 계산한 뒤 합산한다.
     * holidayDates가 있으면 DB 조회 없이 Set으로 판정한다.
     */
    public ScheduleSurchargeQuote calculateForChunks(
            ServiceType serviceType,
            LocalDate serviceDate,
            LocalTime startTime,
            String gradeSnapshot,
            List<FeeChunk> chunks,
            Set<LocalDate> holidayDates) {
        if (CollectionUtils.isEmpty(chunks)) {
            return ScheduleSurchargeQuote.zero();
        }
        if (chunks.size() == 1) {
            FeeChunk only = chunks.get(0);
            LocalTime endTime = plusMinutesWrapping(startTime, only.durationMinutes());
            return calculate(
                    serviceType,
                    serviceDate,
                    startTime,
                    endTime,
                    only.durationMinutes(),
                    gradeSnapshot,
                    only.unitCost(),
                    only.feeItemMinMinutes(),
                    holidayDates);
        }

        int totalAmount = 0;
        int totalMinutes = 0;
        BigDecimal rate = null;
        String periodLabel = "";
        int cursor = startTime.toSecondOfDay() / 60;

        for (FeeChunk chunk : chunks) {
            LocalTime segStart = minutesToLocalTime(cursor);
            LocalTime segEnd = minutesToLocalTime(cursor + chunk.durationMinutes());
            ScheduleSurchargeQuote part = calculate(
                    serviceType,
                    serviceDate,
                    segStart,
                    segEnd,
                    chunk.durationMinutes(),
                    gradeSnapshot,
                    chunk.unitCost(),
                    chunk.feeItemMinMinutes(),
                    holidayDates);
            totalAmount += part.surchargeAmount();
            totalMinutes += part.surchargeMinutes();
            if (part.surchargeAmount() > 0) {
                rate = part.surchargeRate();
                periodLabel = part.periodLabel();
            }
            cursor += chunk.durationMinutes();
        }

        if (totalAmount <= 0) {
            return ScheduleSurchargeQuote.zero();
        }
        return new ScheduleSurchargeQuote(totalAmount, rate, totalMinutes, periodLabel);
    }

    public ScheduleSurchargeQuote calculate(
            ServiceType serviceType,
            LocalDate serviceDate,
            LocalTime startTime,
            LocalTime endTime,
            int durationMinutes,
            String gradeSnapshot,
            int unitCost,
            int feeItemMinMinutes) {
        return calculate(
                serviceType,
                serviceDate,
                startTime,
                endTime,
                durationMinutes,
                gradeSnapshot,
                unitCost,
                feeItemMinMinutes,
                null);
    }

    public ScheduleSurchargeQuote calculate(
            ServiceType serviceType,
            LocalDate serviceDate,
            LocalTime startTime,
            LocalTime endTime,
            int durationMinutes,
            String gradeSnapshot,
            int unitCost,
            int feeItemMinMinutes,
            Set<LocalDate> holidayDates) {
        if (!isEligible(serviceType, gradeSnapshot)) {
            return ScheduleSurchargeQuote.zero();
        }

        int minMinutes = feeItemMinMinutes > 0 ? feeItemMinMinutes : durationMinutes;
        if (minMinutes <= 0 || unitCost <= 0) {
            return ScheduleSurchargeQuote.zero();
        }

        BigDecimal rate;
        int appliedMinutes;
        String periodLabel;

        boolean holiday = holidayDates != null
                ? holidayDates.contains(serviceDate)
                : holidayService.isHoliday(serviceDate);
        if (holiday) {
            rate = HOLIDAY_RATE;
            appliedMinutes = Math.min(durationMinutes, minMinutes);
            periodLabel = "공휴일";
        } else if (serviceDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
            rate = SUNDAY_RATE;
            appliedMinutes = Math.min(durationMinutes, minMinutes);
            periodLabel = "일요일";
        } else {
            int nightMinutes = calcNightOverlapMinutes(startTime, endTime);
            if (nightMinutes <= 0) {
                return ScheduleSurchargeQuote.zero();
            }
            rate = NIGHT_RATE;
            appliedMinutes = Math.min(nightMinutes, minMinutes);
            periodLabel = "심야";
        }

        if (appliedMinutes <= 0) {
            return ScheduleSurchargeQuote.zero();
        }

        BigDecimal rawAmount = BigDecimal.valueOf(unitCost)
                .multiply(rate)
                .multiply(BigDecimal.valueOf(appliedMinutes))
                .divide(BigDecimal.valueOf(minMinutes), 10, RoundingMode.HALF_UP);
        int amount = roundOnesDigit(rawAmount);
        return new ScheduleSurchargeQuote(amount, rate, appliedMinutes, periodLabel);
    }

    private static LocalTime plusMinutesWrapping(LocalTime start, int minutes) {
        return minutesToLocalTime(start.toSecondOfDay() / 60 + minutes);
    }

    private static LocalTime minutesToLocalTime(int absoluteMinutes) {
        int tod = Math.floorMod(absoluteMinutes, MINUTES_PER_DAY);
        return LocalTime.of(tod / 60, tod % 60);
    }

    /** 가산금 일의 자리 반올림 — 십원 단위 (예: 19,307→19,310, 19,304→19,300) */
    static int roundOnesDigit(BigDecimal amount) {
        return amount
                .divide(BigDecimal.TEN, 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.TEN)
                .intValue();
    }

    private static boolean isEligible(ServiceType serviceType, String gradeSnapshot) {
        if (serviceType == ServiceType.family_care) {
            return false;
        }
        if (serviceType == ServiceType.visit_care
                && ReferenceFeeRateService.parseGradeNum(gradeSnapshot) == 5) {
            return false;
        }
        return serviceType == ServiceType.visit_care
                || serviceType == ServiceType.visit_nursing
                || serviceType == ServiceType.full_day_visit;
    }

    static int calcNightOverlapMinutes(LocalTime startTime, LocalTime endTime) {
        int start = startTime.toSecondOfDay() / 60;
        int end = endTime.toSecondOfDay() / 60;
        if (end <= start) {
            end += 24 * 60;
        }
        int overlap1 = Math.max(0, Math.min(end, 360) - Math.max(start, 0));
        int overlap2 = Math.max(0, Math.min(end, 1800) - Math.max(start, 1320));
        return overlap1 + overlap2;
    }

    public record ScheduleSurchargeQuote(
            int surchargeAmount, BigDecimal surchargeRate, int surchargeMinutes, String periodLabel) {

        public static ScheduleSurchargeQuote zero() {
            return new ScheduleSurchargeQuote(0, null, 0, "");
        }
    }
}
