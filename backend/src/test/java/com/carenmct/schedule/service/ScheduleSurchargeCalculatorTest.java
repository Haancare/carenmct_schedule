package com.carenmct.schedule.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.service.ScheduleFeeCalculator.FeeChunk;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScheduleSurchargeCalculatorTest {

    @Mock
    private HolidayService holidayService;

    private ScheduleSurchargeCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new ScheduleSurchargeCalculator(holidayService);
    }

    @Test
    void holiday_visitCare_applies50Percent() {
        LocalDate date = LocalDate.of(2026, 1, 1);
        when(holidayService.isHoliday(date)).thenReturn(true);

        var quote = calculator.calculate(
                ServiceType.visit_care,
                date,
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                60,
                "3등급",
                25320,
                60);

        assertEquals(12660, quote.surchargeAmount());
        assertEquals(new BigDecimal("0.5000"), quote.surchargeRate());
        assertEquals(60, quote.surchargeMinutes());
        assertEquals("공휴일", quote.periodLabel());
    }

    @Test
    void holiday_visitCare_chunks_sumPerSegmentNotOnTotal() {
        LocalDate date = LocalDate.of(2026, 1, 1);
        when(holidayService.isHoliday(date)).thenReturn(true);

        var quote = calculator.calculateForChunks(
                ServiceType.visit_care,
                date,
                LocalTime.of(8, 0),
                "3등급",
                List.of(
                        new FeeChunk(240, 80000, "가-8", 240),
                        new FeeChunk(90, 34120, "가-3", 90)));

        // 각 구간 50% 가산 후 합산: 40000 + 17060
        assertEquals(57060, quote.surchargeAmount());
        assertEquals(new BigDecimal("0.5000"), quote.surchargeRate());
        assertEquals(330, quote.surchargeMinutes());
        assertEquals("공휴일", quote.periodLabel());
    }

    @Test
    void sunday_visitCare_480_chunks_roundPerSegment() {
        // 08:00-16:00 = 240+240, 일요일 30%. 합산 후 반올림(42050)이 아니라 구간별 21020+21020=42040
        LocalDate date = LocalDate.of(2026, 7, 12);
        when(holidayService.isHoliday(date)).thenReturn(false);

        var quote = calculator.calculateForChunks(
                ServiceType.visit_care,
                date,
                LocalTime.of(8, 0),
                "1등급",
                List.of(
                        new FeeChunk(240, 70080, "가-8", 240),
                        new FeeChunk(240, 70080, "가-8", 240)));

        assertEquals(42040, quote.surchargeAmount());
        assertEquals(new BigDecimal("0.3000"), quote.surchargeRate());

        var wrongIfOnTotal = calculator.calculate(
                ServiceType.visit_care,
                date,
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                480,
                "1등급",
                140160,
                240);
        assertEquals(42050, wrongIfOnTotal.surchargeAmount());
    }

    @Test
    void fullDayVisit_holiday_applies50Percent() {
        LocalDate date = LocalDate.of(2026, 1, 1);
        when(holidayService.isHoliday(date)).thenReturn(true);

        var quote = calculator.calculate(
                ServiceType.full_day_visit,
                date,
                LocalTime.of(8, 0),
                LocalTime.of(20, 0),
                720,
                "1등급",
                98860,
                0);

        assertEquals(49430, quote.surchargeAmount());
        assertEquals("공휴일", quote.periodLabel());
    }

    @Test
    void sunday_visitNursing_applies30Percent() {
        LocalDate date = LocalDate.of(2026, 3, 8);
        when(holidayService.isHoliday(date)).thenReturn(false);

        var quote = calculator.calculate(
                ServiceType.visit_nursing,
                date,
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                30,
                "2등급",
                53770,
                30);

        assertEquals(16130, quote.surchargeAmount());
        assertEquals(new BigDecimal("0.3000"), quote.surchargeRate());
        assertEquals(30, quote.surchargeMinutes());
        assertEquals("일요일", quote.periodLabel());
    }

    @Test
    void sunday_roundsOnesDigitToNearestTen() {
        LocalDate date = LocalDate.of(2026, 3, 8);
        when(holidayService.isHoliday(date)).thenReturn(false);

        var quote = calculator.calculate(
                ServiceType.visit_nursing,
                date,
                LocalTime.of(9, 0),
                LocalTime.of(9, 30),
                30,
                "2등급",
                53769,
                30);

        assertEquals(16130, quote.surchargeAmount());
    }

    @Test
    void night_overlap_applies30PercentOnNightMinutesOnly() {
        LocalDate date = LocalDate.of(2026, 3, 9);
        when(holidayService.isHoliday(date)).thenReturn(false);

        var quote = calculator.calculate(
                ServiceType.visit_care,
                date,
                LocalTime.of(22, 0),
                LocalTime.of(23, 0),
                60,
                "3등급",
                25320,
                60);

        assertEquals(7600, quote.surchargeAmount());
        assertEquals(new BigDecimal("0.3000"), quote.surchargeRate());
        assertEquals(60, quote.surchargeMinutes());
        assertEquals("심야", quote.periodLabel());
    }

    @Test
    void familyCare_isExcluded() {
        LocalDate date = LocalDate.of(2026, 1, 1);

        var quote = calculator.calculate(
                ServiceType.family_care,
                date,
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                60,
                "3등급",
                25320,
                60);

        assertEquals(0, quote.surchargeAmount());
        assertNull(quote.surchargeRate());
    }

    @Test
    void visitCare_grade5_isExcluded() {
        LocalDate date = LocalDate.of(2026, 3, 8);

        var quote = calculator.calculate(
                ServiceType.visit_care,
                date,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                60,
                "5등급",
                25320,
                60);

        assertEquals(0, quote.surchargeAmount());
    }

    @Test
    void visitBath_isExcluded() {
        LocalDate date = LocalDate.of(2026, 1, 1);

        var quote = calculator.calculate(
                ServiceType.visit_bath,
                date,
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                60,
                "3등급",
                88990,
                60);

        assertEquals(0, quote.surchargeAmount());
    }

    @Test
    void roundOnesDigit_examples() {
        assertEquals(19310, ScheduleSurchargeCalculator.roundOnesDigit(new BigDecimal("19307")));
        assertEquals(19300, ScheduleSurchargeCalculator.roundOnesDigit(new BigDecimal("19304")));
        assertEquals(19310, ScheduleSurchargeCalculator.roundOnesDigit(new BigDecimal("19305")));
    }

    @Test
    void calcNightOverlap_crossMidnight() {
        assertEquals(
                120,
                ScheduleSurchargeCalculator.calcNightOverlapMinutes(
                        LocalTime.of(23, 0), LocalTime.of(1, 0)));
    }
}
