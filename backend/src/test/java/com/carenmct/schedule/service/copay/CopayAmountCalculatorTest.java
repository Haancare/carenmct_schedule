package com.carenmct.schedule.service.copay;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class CopayAmountCalculatorTest {

    @Test
    void calcCopayFromBenefit_usesTenWonTruncate() {
        assertEquals(7590, CopayAmountCalculator.calcCopayFromBenefit(50640, new BigDecimal("15.00")));
    }

    @Test
    void calcMonthlyCopayTotal_sumsGroupsWithTenWonTruncate() {
        ServiceSchedule first = schedule(1L, 25320, "3등급", "일반대상자", new BigDecimal("15.00"));
        ServiceSchedule second = schedule(2L, 25320, "3등급", "일반대상자", new BigDecimal("15.00"));

        assertEquals(7590, CopayAmountCalculator.calcMonthlyCopayTotal(List.of(first, second)));
    }

    @Test
    void calcMonthlyCopayTotal_differentGradeGroups_calculatedSeparately() {
        ServiceSchedule grade3 = schedule(1L, 10000, "3등급", "일반대상자", new BigDecimal("15.00"));
        ServiceSchedule grade2 = schedule(2L, 10000, "2등급", "일반대상자", new BigDecimal("15.00"));

        assertEquals(3000, CopayAmountCalculator.calcMonthlyCopayTotal(List.of(grade3, grade2)));
    }

    private static ServiceSchedule schedule(
            long id, int benefitTotal, String grade, String reduction, BigDecimal copayRate) {
        ServiceSchedule schedule = newInstance();
        setField(schedule, "id", id);
        setField(schedule, "serviceType", ServiceType.visit_care);
        setField(schedule, "scheduleKind", ScheduleKind.plan);
        setField(schedule, "serviceDate", LocalDate.of(2026, 3, 10));
        setField(schedule, "startTime", LocalTime.of(9, 0));
        setField(schedule, "endTime", LocalTime.of(10, 0));
        setField(schedule, "unitCost", benefitTotal);
        setField(schedule, "surchargeAmount", 0);
        setField(schedule, "benefitTotal", benefitTotal);
        setField(schedule, "gradeSnapshot", grade);
        setField(schedule, "reductionSnapshot", reduction);
        setField(schedule, "copayRateSnapshot", copayRate);
        setField(schedule, "updatedAt", LocalDateTime.now());
        return schedule;
    }

    private static ServiceSchedule newInstance() {
        try {
            var ctor = ServiceSchedule.class.getDeclaredConstructor();
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
