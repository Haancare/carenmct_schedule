package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.QServiceSchedule;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

@Repository
@RequiredArgsConstructor
public class ServiceScheduleRepositoryImpl implements ServiceScheduleRepositoryCustom {

    private static final QServiceSchedule schedule = QServiceSchedule.serviceSchedule;

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ServiceSchedule> findActive(ServiceScheduleSearchCondition condition) {
        return queryFactory
                .selectFrom(schedule)
                .where(activePredicate(condition))
                .orderBy(schedule.serviceDate.asc(), schedule.startTime.asc(), schedule.id.asc())
                .fetch();
    }

    @Override
    public java.util.Optional<ServiceSchedule> findActiveById(String facilityId, Long id) {
        if (!StringUtils.hasText(facilityId) || id == null) {
            return java.util.Optional.empty();
        }
        return java.util.Optional.ofNullable(
                queryFactory
                        .selectFrom(schedule)
                        .where(
                                schedule.facilityId.eq(facilityId),
                                schedule.id.eq(id),
                                schedule.deletedAt.isNull())
                        .fetchFirst());
    }

    @Override
    public List<ServiceSchedule> findActiveForRecipientMonth(
            String facilityId, Long recipientId, int year, int month) {
        if (!StringUtils.hasText(facilityId) || recipientId == null) {
            return List.of();
        }
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        return queryFactory
                .selectFrom(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.recipientId.eq(recipientId),
                        schedule.deletedAt.isNull(),
                        schedule.serviceDate.between(from, to))
                .orderBy(schedule.serviceDate.asc(), schedule.startTime.asc(), schedule.id.asc())
                .fetch();
    }

    @Override
    public boolean existsActiveInYear(String facilityId, Long recipientId, int year) {
        if (!StringUtils.hasText(facilityId) || recipientId == null) {
            return false;
        }

        Integer found = queryFactory
                .selectOne()
                .from(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.recipientId.eq(recipientId),
                        schedule.deletedAt.isNull(),
                        schedule.serviceDate.between(
                                LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)))
                .fetchFirst();

        return found != null;
    }

    @Override
    public Set<Long> findRecipientIdsWithActiveInYear(String facilityId, int year) {
        if (!StringUtils.hasText(facilityId)) {
            return Set.of();
        }
        return Set.copyOf(
                queryFactory
                        .select(schedule.recipientId)
                        .distinct()
                        .from(schedule)
                        .where(
                                schedule.facilityId.eq(facilityId),
                                schedule.deletedAt.isNull(),
                                schedule.serviceDate.between(
                                        LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)))
                        .fetch());
    }

    @Override
    public Set<Long> findRecipientIdsWithActiveInMonth(String facilityId, int year, int month) {
        if (!StringUtils.hasText(facilityId)) {
            return Set.of();
        }
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.withDayOfMonth(from.lengthOfMonth());
        return Set.copyOf(
                queryFactory
                        .select(schedule.recipientId)
                        .distinct()
                        .from(schedule)
                        .where(
                                schedule.facilityId.eq(facilityId),
                                schedule.deletedAt.isNull(),
                                schedule.serviceDate.between(from, to))
                        .fetch());
    }

    @Override
    public Set<ServiceType> findDistinctServiceTypesInYear(String facilityId, Long recipientId, int year) {
        return Set.copyOf(
                queryFactory
                        .select(schedule.serviceType)
                        .distinct()
                        .from(schedule)
                        .where(
                                schedule.facilityId.eq(facilityId),
                                schedule.recipientId.eq(recipientId),
                                schedule.deletedAt.isNull(),
                                schedule.serviceDate.between(
                                        LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)))
                        .fetch());
    }

    @Override
    public java.util.Map<Long, Set<ServiceType>> findDistinctServiceTypesInYearByFacility(
            String facilityId, int year) {
        if (!StringUtils.hasText(facilityId)) {
            return java.util.Map.of();
        }
        var rows = queryFactory
                .select(schedule.recipientId, schedule.serviceType)
                .distinct()
                .from(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.deletedAt.isNull(),
                        schedule.serviceDate.between(
                                LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31)))
                .fetch();

        java.util.Map<Long, Set<ServiceType>> result = new java.util.HashMap<>();
        for (var row : rows) {
            Long recipientId = row.get(schedule.recipientId);
            ServiceType serviceType = row.get(schedule.serviceType);
            if (recipientId == null || serviceType == null) {
                continue;
            }
            result.computeIfAbsent(recipientId, ignored -> new java.util.HashSet<>()).add(serviceType);
        }
        return result;
    }

    @Override
    public List<RecipientMonthKindCount> countActiveByRecipientMonthKind(
            String facilityId, int year, Set<Long> recipientIds) {
        if (!StringUtils.hasText(facilityId) || CollectionUtils.isEmpty(recipientIds)) {
            return List.of();
        }
        return countActiveBetween(
                facilityId,
                LocalDate.of(year, 1, 1),
                LocalDate.of(year, 12, 31),
                recipientIds);
    }

    @Override
    public List<RecipientMonthKindCount> countActiveByFacilityForMonth(
            String facilityId, int year, int month) {
        if (!StringUtils.hasText(facilityId)) {
            return List.of();
        }
        LocalDate from = LocalDate.of(year, month, 1);
        return countActiveBetween(
                facilityId, from, from.withDayOfMonth(from.lengthOfMonth()), null);
    }

    @Override
    public List<RecipientMonthKindCount> countActiveByRecipientForMonth(
            String facilityId, int year, int month, Set<Long> recipientIds) {
        if (!StringUtils.hasText(facilityId) || CollectionUtils.isEmpty(recipientIds)) {
            return List.of();
        }
        LocalDate from = LocalDate.of(year, month, 1);
        return countActiveBetween(
                facilityId, from, from.withDayOfMonth(from.lengthOfMonth()), recipientIds);
    }

    private List<RecipientMonthKindCount> countActiveBetween(
            String facilityId, LocalDate from, LocalDate to, Set<Long> recipientIds) {
        var monthExpression =
                Expressions.numberTemplate(Integer.class, "month({0})", schedule.serviceDate);

        var where = new BooleanBuilder()
                .and(schedule.facilityId.eq(facilityId))
                .and(schedule.deletedAt.isNull())
                .and(schedule.serviceDate.between(from, to));
        if (!CollectionUtils.isEmpty(recipientIds)) {
            where.and(schedule.recipientId.in(recipientIds));
        }

        return queryFactory
                .select(
                        Projections.constructor(
                                RecipientMonthKindCount.class,
                                schedule.recipientId,
                                monthExpression,
                                schedule.scheduleKind,
                                schedule.count()))
                .from(schedule)
                .where(where)
                .groupBy(schedule.recipientId, monthExpression, schedule.scheduleKind)
                .fetch();
    }

    @Override
    public boolean existsActivePlanDuplicate(
            String facilityId,
            Long recipientId,
            LocalDate serviceDate,
            Long employeeId,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime) {
        if (!StringUtils.hasText(facilityId)
                || recipientId == null
                || serviceDate == null
                || employeeId == null
                || serviceType == null
                || startTime == null
                || endTime == null) {
            return false;
        }

        Integer found = queryFactory
                .selectOne()
                .from(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.recipientId.eq(recipientId),
                        schedule.serviceDate.eq(serviceDate),
                        schedule.employeeId.eq(employeeId),
                        schedule.serviceType.eq(serviceType),
                        schedule.startTime.eq(startTime),
                        schedule.endTime.eq(endTime),
                        schedule.scheduleKind.eq(ScheduleKind.plan),
                        schedule.deletedAt.isNull())
                .fetchFirst();

        return found != null;
    }

    @Override
    public boolean existsActiveClaimDuplicate(
            String facilityId,
            Long recipientId,
            LocalDate serviceDate,
            Long employeeId,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime) {
        if (!StringUtils.hasText(facilityId)
                || recipientId == null
                || serviceDate == null
                || employeeId == null
                || serviceType == null
                || startTime == null
                || endTime == null) {
            return false;
        }

        Integer found = queryFactory
                .selectOne()
                .from(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.recipientId.eq(recipientId),
                        schedule.serviceDate.eq(serviceDate),
                        schedule.employeeId.eq(employeeId),
                        schedule.serviceType.eq(serviceType),
                        schedule.startTime.eq(startTime),
                        schedule.endTime.eq(endTime),
                        schedule.scheduleKind.eq(ScheduleKind.claim),
                        schedule.deletedAt.isNull())
                .fetchFirst();

        return found != null;
    }

    @Override
    public List<ServiceSchedule> findActiveRecipientPlansOnDate(
            String facilityId, Long recipientId, LocalDate serviceDate) {
        if (!StringUtils.hasText(facilityId) || recipientId == null || serviceDate == null) {
            return List.of();
        }
        return queryFactory
                .selectFrom(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.recipientId.eq(recipientId),
                        schedule.serviceDate.eq(serviceDate),
                        schedule.scheduleKind.eq(ScheduleKind.plan),
                        schedule.deletedAt.isNull())
                .fetch();
    }

    @Override
    public List<ServiceSchedule> findActiveEmployeePlansOnDate(
            String facilityId, Long employeeId, LocalDate serviceDate) {
        if (!StringUtils.hasText(facilityId) || employeeId == null || serviceDate == null) {
            return List.of();
        }
        return queryFactory
                .selectFrom(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.serviceDate.eq(serviceDate),
                        schedule.scheduleKind.eq(ScheduleKind.plan),
                        schedule.deletedAt.isNull(),
                        schedule.employeeId
                                .eq(employeeId)
                                .or(schedule.secondaryEmployeeId.eq(employeeId)))
                .fetch();
    }

    @Override
    public long deleteHardByFacilityKindAndMonth(
            String facilityId, ScheduleKind scheduleKind, int year, int month) {
        if (!StringUtils.hasText(facilityId) || scheduleKind == null || year < 1 || month < 1 || month > 12) {
            return 0;
        }
        LocalDate from = LocalDate.of(year, month, 1);
        LocalDate to = from.plusMonths(1);
        return queryFactory
                .delete(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.scheduleKind.eq(scheduleKind),
                        schedule.serviceDate.goe(from),
                        schedule.serviceDate.lt(to))
                .execute();
    }

    @Override
    public List<CopaySegmentSourceRow> findCopaySegmentSources(String facilityId, int year) {
        if (!StringUtils.hasText(facilityId) || year < 1) {
            return List.of();
        }
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);
        NumberExpression<Integer> monthExpr =
                Expressions.numberTemplate(Integer.class, "month({0})", schedule.serviceDate);
        return queryFactory
                .select(Projections.constructor(
                        CopaySegmentSourceRow.class,
                        schedule.recipientId,
                        monthExpr,
                        schedule.serviceType,
                        schedule.gradeSnapshot,
                        schedule.reductionSnapshot))
                .distinct()
                .from(schedule)
                .where(
                        schedule.facilityId.eq(facilityId),
                        schedule.deletedAt.isNull(),
                        schedule.serviceDate.between(from, to),
                        schedule.serviceType.in(CopaySegmentAggregator.COPAY_SERVICE_TYPES))
                .fetch();
    }

    private BooleanBuilder activePredicate(ServiceScheduleSearchCondition condition) {
        BooleanBuilder builder = new BooleanBuilder();

        builder.and(schedule.facilityId.eq(condition.getFacilityId()));
        builder.and(schedule.deletedAt.isNull());

        if (condition.getDateFrom() != null) {
            builder.and(schedule.serviceDate.goe(condition.getDateFrom()));
        }
        if (condition.getDateTo() != null) {
            builder.and(schedule.serviceDate.loe(condition.getDateTo()));
        }
        if (condition.getRecipientId() != null) {
            builder.and(schedule.recipientId.eq(condition.getRecipientId()));
        }
        if (!CollectionUtils.isEmpty(condition.getRecipientIds())) {
            builder.and(schedule.recipientId.in(condition.getRecipientIds()));
        }
        if (condition.getScheduleKind() != null) {
            builder.and(schedule.scheduleKind.eq(condition.getScheduleKind()));
        }
        if (condition.getServiceType() != null) {
            builder.and(schedule.serviceType.eq(condition.getServiceType()));
        }
        if (condition.getEmployeeId() != null) {
            builder.and(
                    schedule.employeeId
                            .eq(condition.getEmployeeId())
                            .or(schedule.secondaryEmployeeId.eq(condition.getEmployeeId())));
        }

        return builder;
    }
}
