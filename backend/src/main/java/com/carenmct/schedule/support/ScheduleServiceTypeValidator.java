package com.carenmct.schedule.support;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

public final class ScheduleServiceTypeValidator {

    private static final int FULL_DAY_MIN_MINUTES = 720;

    private ScheduleServiceTypeValidator() {}

    public static void validate(ServiceType serviceType, int durationMinutes, String familyRelation) {
        if (serviceType == ServiceType.family_care) {
            if (!StringUtils.hasText(familyRelation)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "가족요양은 가족관계(familyRelation)가 필요합니다.");
            }
            if (durationMinutes != 60 && durationMinutes != 90) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "가족요양은 60분 또는 90분만 선택할 수 있습니다.");
            }
        }
        if (serviceType == ServiceType.full_day_visit && durationMinutes < FULL_DAY_MIN_MINUTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "종일방문은 12시간(720분) 이상 제공해야 합니다.");
        }
    }
}
