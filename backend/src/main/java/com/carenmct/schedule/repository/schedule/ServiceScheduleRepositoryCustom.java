package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface ServiceScheduleRepositoryCustom {

    List<ServiceSchedule> findActive(ServiceScheduleSearchCondition condition);

    java.util.Optional<ServiceSchedule> findActiveById(String facilityId, Long id);

    List<ServiceSchedule> findActiveForRecipientMonth(
            String facilityId, Long recipientId, int year, int month);

    boolean existsActiveInYear(String facilityId, Long recipientId, int year);

    /** 기관·연도 기준 일정이 있는 수급자 ID */
    Set<Long> findRecipientIdsWithActiveInYear(String facilityId, int year);

    /** 기관·특정 월 기준 일정이 있는 수급자 ID */
    Set<Long> findRecipientIdsWithActiveInMonth(String facilityId, int year, int month);

    Set<ServiceType> findDistinctServiceTypesInYear(String facilityId, Long recipientId, int year);

    /** 기관·연도 기준 수급자별 급여유형 */
    Map<Long, Set<ServiceType>> findDistinctServiceTypesInYearByFacility(String facilityId, int year);

    List<RecipientMonthKindCount> countActiveByRecipientMonthKind(
            String facilityId, int year, Set<Long> recipientIds);

    /** 기관·특정 월 plan/claim 건수 (전체 수급자) */
    List<RecipientMonthKindCount> countActiveByFacilityForMonth(String facilityId, int year, int month);

    /** 특정 월·수급자 집합 plan/claim 건수 */
    List<RecipientMonthKindCount> countActiveByRecipientForMonth(
            String facilityId, int year, int month, Set<Long> recipientIds);

    boolean existsActivePlanDuplicate(
            String facilityId,
            Long recipientId,
            LocalDate serviceDate,
            Long employeeId,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime);

    boolean existsActiveClaimDuplicate(
            String facilityId,
            Long recipientId,
            LocalDate serviceDate,
            Long employeeId,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime);

    List<ServiceSchedule> findActiveRecipientPlansOnDate(
            String facilityId, Long recipientId, LocalDate serviceDate);

    List<ServiceSchedule> findActiveEmployeePlansOnDate(
            String facilityId, Long employeeId, LocalDate serviceDate);

    /** 기관·월·종류(plan/claim) 일정 물리 삭제 (soft delete 아님) */
    long deleteHardByFacilityKindAndMonth(
            String facilityId, ScheduleKind scheduleKind, int year, int month);

    /** 본인부담금 월요약용 — 연간 일정의 세그먼트 소스만 경량 조회 */
    List<CopaySegmentSourceRow> findCopaySegmentSources(String facilityId, int year);
}
