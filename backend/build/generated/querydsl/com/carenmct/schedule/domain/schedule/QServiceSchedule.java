package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QServiceSchedule is a Querydsl query type for ServiceSchedule
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QServiceSchedule extends EntityPathBase<ServiceSchedule> {

    private static final long serialVersionUID = -1725079384L;

    public static final QServiceSchedule serviceSchedule = new QServiceSchedule("serviceSchedule");

    public final StringPath bathType = createString("bathType");

    public final NumberPath<Integer> benefitTotal = createNumber("benefitTotal", Integer.class);

    public final NumberPath<java.math.BigDecimal> copayRateSnapshot = createNumber("copayRateSnapshot", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> createdBy = createNumber("createdBy", Long.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Integer> durationMinutes = createNumber("durationMinutes", Integer.class);

    public final NumberPath<Long> employeeId = createNumber("employeeId", Long.class);

    public final TimePath<java.time.LocalTime> endTime = createTime("endTime", java.time.LocalTime.class);

    public final StringPath externalRef = createString("externalRef");

    public final StringPath facilityId = createString("facilityId");

    public final StringPath familyRelation = createString("familyRelation");

    public final StringPath feeCode = createString("feeCode");

    public final BooleanPath feeEdited = createBoolean("feeEdited");

    public final StringPath gradeSnapshot = createString("gradeSnapshot");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> importBatchId = createNumber("importBatchId", Long.class);

    public final StringPath notes = createString("notes");

    public final NumberPath<Long> planScheduleId = createNumber("planScheduleId", Long.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final StringPath reductionSnapshot = createString("reductionSnapshot");

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ScheduleKind> scheduleKind = createEnum("scheduleKind", com.carenmct.schedule.domain.schedule.enums.ScheduleKind.class);

    public final NumberPath<Long> secondaryEmployeeId = createNumber("secondaryEmployeeId", Long.class);

    public final DatePath<java.time.LocalDate> serviceDate = createDate("serviceDate", java.time.LocalDate.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ServiceType> serviceType = createEnum("serviceType", com.carenmct.schedule.domain.schedule.enums.ServiceType.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ScheduleSource> source = createEnum("source", com.carenmct.schedule.domain.schedule.enums.ScheduleSource.class);

    public final TimePath<java.time.LocalTime> startTime = createTime("startTime", java.time.LocalTime.class);

    public final NumberPath<Integer> surchargeAmount = createNumber("surchargeAmount", Integer.class);

    public final NumberPath<Integer> surchargeMinutes = createNumber("surchargeMinutes", Integer.class);

    public final NumberPath<java.math.BigDecimal> surchargeRate = createNumber("surchargeRate", java.math.BigDecimal.class);

    public final NumberPath<Integer> unitCost = createNumber("unitCost", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> updatedBy = createNumber("updatedBy", Long.class);

    public final StringPath visitType = createString("visitType");

    public QServiceSchedule(String variable) {
        super(ServiceSchedule.class, forVariable(variable));
    }

    public QServiceSchedule(Path<? extends ServiceSchedule> path) {
        super(path.getType(), path.getMetadata());
    }

    public QServiceSchedule(PathMetadata metadata) {
        super(ServiceSchedule.class, metadata);
    }

}

