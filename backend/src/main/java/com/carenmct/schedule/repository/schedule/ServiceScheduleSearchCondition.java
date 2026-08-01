package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalDate;
import java.util.Set;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ServiceScheduleSearchCondition {

    private final String facilityId;
    private final LocalDate dateFrom;
    private final LocalDate dateTo;
    private final Long recipientId;
    private final Set<Long> recipientIds;
    private final ScheduleKind scheduleKind;
    private final ServiceType serviceType;
    private final Long employeeId;

    public static ServiceScheduleSearchCondition forFacilityYear(String facilityId, int year) {
        return ServiceScheduleSearchCondition.builder()
                .facilityId(facilityId)
                .dateFrom(LocalDate.of(year, 1, 1))
                .dateTo(LocalDate.of(year, 12, 31))
                .build();
    }

    public static ServiceScheduleSearchCondition forFacilityMonth(
            String facilityId, int year, int month, Set<Long> recipientIds, ScheduleKind scheduleKind) {
        LocalDate from = LocalDate.of(year, month, 1);
        return ServiceScheduleSearchCondition.builder()
                .facilityId(facilityId)
                .dateFrom(from)
                .dateTo(from.withDayOfMonth(from.lengthOfMonth()))
                .recipientIds(recipientIds)
                .scheduleKind(scheduleKind)
                .build();
    }

    public static ServiceScheduleSearchCondition forRecipientYear(
            String facilityId, Long recipientId, int year, ScheduleKind scheduleKind) {
        return ServiceScheduleSearchCondition.builder()
                .facilityId(facilityId)
                .recipientId(recipientId)
                .dateFrom(LocalDate.of(year, 1, 1))
                .dateTo(LocalDate.of(year, 12, 31))
                .scheduleKind(scheduleKind)
                .build();
    }
}
