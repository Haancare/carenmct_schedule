package com.carenmct.schedule.support;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ScheduleServiceTypeValidatorTest {

    @Test
    void familyCare_requiresRelationAnd60or90() {
        assertThrows(
                ResponseStatusException.class,
                () -> ScheduleServiceTypeValidator.validate(ServiceType.family_care, 60, null));
        assertThrows(
                ResponseStatusException.class,
                () -> ScheduleServiceTypeValidator.validate(ServiceType.family_care, 120, "자"));
        assertDoesNotThrow(
                () -> ScheduleServiceTypeValidator.validate(ServiceType.family_care, 60, "자"));
        assertDoesNotThrow(
                () -> ScheduleServiceTypeValidator.validate(ServiceType.family_care, 90, "처"));
    }

    @Test
    void fullDayVisit_requires720Minutes() {
        assertThrows(
                ResponseStatusException.class,
                () -> ScheduleServiceTypeValidator.validate(ServiceType.full_day_visit, 480, null));
        assertDoesNotThrow(
                () -> ScheduleServiceTypeValidator.validate(ServiceType.full_day_visit, 720, null));
    }
}
