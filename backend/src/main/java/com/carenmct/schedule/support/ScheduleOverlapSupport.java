package com.carenmct.schedule.support;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public final class ScheduleOverlapSupport {

    private ScheduleOverlapSupport() {}

    public static boolean isOverlapException(ServiceType a, ServiceType b) {
        if (a == ServiceType.visit_nursing && isCareLike(b)) {
            return true;
        }
        if (b == ServiceType.visit_nursing && isCareLike(a)) {
            return true;
        }
        return false;
    }

    private static boolean isCareLike(ServiceType type) {
        return type == ServiceType.visit_care
                || type == ServiceType.family_care
                || type == ServiceType.visit_bath
                || type == ServiceType.full_day_visit;
    }

    public static boolean timesOverlap(
            LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        int s1 = toMinutes(start1);
        int e1 = toMinutes(end1);
        int s2 = toMinutes(start2);
        int e2 = toMinutes(end2);
        if (e1 <= s1) {
            e1 += 24 * 60;
        }
        if (e2 <= s2) {
            e2 += 24 * 60;
        }
        return s1 < e2 && s2 < e1;
    }

    public static boolean hasRecipientPlanOverlap(
            List<ServiceSchedule> sameRecipientDayPlans,
            ServiceType newType,
            LocalTime startTime,
            LocalTime endTime) {
        return findRecipientPlanOverlap(sameRecipientDayPlans, newType, startTime, endTime)
                .isPresent();
    }

    public static Optional<ServiceSchedule> findRecipientPlanOverlap(
            List<ServiceSchedule> sameRecipientDayPlans,
            ServiceType newType,
            LocalTime startTime,
            LocalTime endTime) {
        for (ServiceSchedule existing : sameRecipientDayPlans) {
            if (isOverlapException(newType, existing.getServiceType())) {
                continue;
            }
            if (timesOverlap(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                return Optional.of(existing);
            }
        }
        return Optional.empty();
    }

    public static boolean hasEmployeePlanOverlapWithOtherRecipients(
            List<ServiceSchedule> employeeDayPlans,
            Long recipientId,
            ServiceType newType,
            LocalTime startTime,
            LocalTime endTime) {
        return findEmployeePlanOverlapWithOtherRecipients(
                        employeeDayPlans, recipientId, newType, startTime, endTime)
                .isPresent();
    }

    public static Optional<ServiceSchedule> findEmployeePlanOverlapWithOtherRecipients(
            List<ServiceSchedule> employeeDayPlans,
            Long recipientId,
            ServiceType newType,
            LocalTime startTime,
            LocalTime endTime) {
        for (ServiceSchedule existing : employeeDayPlans) {
            if (recipientId.equals(existing.getRecipientId())) {
                continue;
            }
            if (isOverlapException(newType, existing.getServiceType())) {
                continue;
            }
            if (timesOverlap(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                return Optional.of(existing);
            }
        }
        return Optional.empty();
    }

    private static int toMinutes(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
    }
}
