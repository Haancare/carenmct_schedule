package com.carenmct.schedule.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateItem;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateServiceHeader;
import com.carenmct.schedule.repository.schedule.reference.AnnualFeeRateServiceHeaderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ScheduleFeeCalculatorTest {

    @Mock
    private AnnualFeeRateServiceHeaderRepository feeRateHeaderRepository;

    private ScheduleFeeCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new ScheduleFeeCalculator(feeRateHeaderRepository);
    }

    @Test
    void visitCare_60minutes_matchesGa2() {
        AnnualFeeRateServiceHeader header = header(ServiceType.visit_care, null, null, null);
        header.getItems().add(item("가-1", 17450, 30, 60, false));
        header.getItems().add(item("가-2", 25320, 60, 90, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.visit_care))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.visit_care, 60, "3등급", null);

        assertEquals(25320, quote.unitCost());
        assertEquals("가-2", quote.feeCode());
        assertEquals(60, quote.feeItemMinMinutes());
        assertEquals(1, quote.chunks().size());
    }

    @Test
    void visitCare_330minutes_splits240And90() {
        AnnualFeeRateServiceHeader header = header(ServiceType.visit_care, null, null, null);
        header.getItems().add(item("가-3", 34120, 90, 120, false));
        header.getItems().add(item("가-8", 80000, 240, 270, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.visit_care))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.visit_care, 330, "3등급", null);

        assertEquals(List.of(240, 90), ScheduleFeeCalculator.splitVisitCareDurations(330));
        assertEquals(80000 + 34120, quote.unitCost());
        assertEquals("가-8", quote.feeCode());
        assertEquals(2, quote.chunks().size());
        assertEquals(240, quote.chunks().get(0).durationMinutes());
        assertEquals(90, quote.chunks().get(1).durationMinutes());
    }

    @Test
    void visitCare_480minutes_splitsTwo240() {
        AnnualFeeRateServiceHeader header = header(ServiceType.visit_care, null, null, null);
        header.getItems().add(item("가-8", 80000, 240, 270, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.visit_care))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.visit_care, 480, "3등급", null);

        assertEquals(List.of(240, 240), ScheduleFeeCalculator.splitVisitCareDurations(480));
        assertEquals(160000, quote.unitCost());
        assertEquals(2, quote.chunks().size());
    }

    @Test
    void visitBath_45minutes_appliesPartial80Percent() {
        AnnualFeeRateServiceHeader header =
                header(ServiceType.visit_bath, 40, 60, new BigDecimal("0.8000"));
        header.getItems().add(item("나-1", 88990, 60, null, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.visit_bath))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.visit_bath, 45, "3등급", "차량이용(차량내)");

        assertEquals(71200, quote.unitCost());
        assertEquals("나-1", quote.feeCode());
    }

    @Test
    void fullDayVisit_under720minutes_rejected() {
        AnnualFeeRateServiceHeader header = header(ServiceType.full_day_visit, null, null, null);
        header.getItems().add(item("마-1", 98860, 0, null, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.full_day_visit))
                .thenReturn(Optional.of(header));

        assertThrows(
                ResponseStatusException.class,
                () -> calculator.calculate(2026, ServiceType.full_day_visit, 480, "1등급", null));
    }

    @Test
    void familyCare_60minutes_matchesGa2() {
        AnnualFeeRateServiceHeader header = header(ServiceType.family_care, null, null, null);
        header.getItems().add(item("가-1", 17450, 30, 60, false));
        header.getItems().add(item("가-2", 25320, 60, 90, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.family_care))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.family_care, 60, "3등급", null);

        assertEquals(25320, quote.unitCost());
        assertEquals("가-2", quote.feeCode());
        assertEquals(60, quote.feeItemMinMinutes());
    }

    @Test
    void familyCare_90minutes_matchesGa3() {
        AnnualFeeRateServiceHeader header = header(ServiceType.family_care, null, null, null);
        header.getItems().add(item("가-2", 25320, 60, 90, false));
        header.getItems().add(item("가-3", 34120, 90, 120, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.family_care))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.family_care, 90, "3등급", null);

        assertEquals(34120, quote.unitCost());
        assertEquals("가-3", quote.feeCode());
        assertEquals(90, quote.feeItemMinMinutes());
    }

    @Test
    void fullDayVisit_720minutes_matchesMa1() {
        AnnualFeeRateServiceHeader header = header(ServiceType.full_day_visit, null, null, null);
        header.getItems().add(item("마-1", 98860, 0, null, false));

        when(feeRateHeaderRepository.findWithItemsByYearAndServiceType(2026, ServiceType.full_day_visit))
                .thenReturn(Optional.of(header));

        var quote = calculator.calculate(2026, ServiceType.full_day_visit, 720, "1등급", null);

        assertEquals(98860, quote.unitCost());
        assertEquals("마-1", quote.feeCode());
    }

    private static AnnualFeeRateServiceHeader header(
            ServiceType serviceType, Integer partialMin, Integer partialMax, BigDecimal partialRate) {
        AnnualFeeRateServiceHeader header = newInstance(AnnualFeeRateServiceHeader.class);
        setField(header, "benefitYear", 2026);
        setField(header, "serviceType", serviceType);
        setField(header, "partialMinMinutes", partialMin);
        setField(header, "partialMaxMinutes", partialMax);
        setField(header, "partialRate", partialRate);
        return header;
    }

    private static AnnualFeeRateItem item(
            String feeCode, int amount, int minMinutes, Integer maxMinutes, boolean maxInclusive) {
        AnnualFeeRateItem item = newInstance(AnnualFeeRateItem.class);
        setField(item, "feeCode", feeCode);
        setField(item, "amount", amount);
        setField(item, "minMinutes", minMinutes);
        setField(item, "maxMinutes", maxMinutes);
        setField(item, "maxInclusive", maxInclusive);
        return item;
    }

    private static <T> T newInstance(Class<T> clazz) {
        try {
            var ctor = clazz.getDeclaredConstructor();
            ctor.setAccessible(true);
            return ctor.newInstance();
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }

    private static void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
