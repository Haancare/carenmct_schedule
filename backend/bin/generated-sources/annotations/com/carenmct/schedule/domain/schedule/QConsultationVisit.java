package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QConsultationVisit is a Querydsl query type for ConsultationVisit
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QConsultationVisit extends EntityPathBase<ConsultationVisit> {

    private static final long serialVersionUID = -1527201410L;

    public static final QConsultationVisit consultationVisit = new QConsultationVisit("consultationVisit");

    public final TimePath<java.time.LocalTime> actualEndTime = createTime("actualEndTime", java.time.LocalTime.class);

    public final TimePath<java.time.LocalTime> actualStartTime = createTime("actualStartTime", java.time.LocalTime.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ConsultStatus> consultStatus = createEnum("consultStatus", com.carenmct.schedule.domain.schedule.enums.ConsultStatus.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ConsultType> consultType = createEnum("consultType", com.carenmct.schedule.domain.schedule.enums.ConsultType.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> createdBy = createNumber("createdBy", Long.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> employeeId = createNumber("employeeId", Long.class);

    public final StringPath facilityId = createString("facilityId");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath notes = createString("notes");

    public final TimePath<java.time.LocalTime> plannedEndTime = createTime("plannedEndTime", java.time.LocalTime.class);

    public final TimePath<java.time.LocalTime> plannedStartTime = createTime("plannedStartTime", java.time.LocalTime.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> updatedBy = createNumber("updatedBy", Long.class);

    public final DatePath<java.time.LocalDate> visitDate = createDate("visitDate", java.time.LocalDate.class);

    public QConsultationVisit(String variable) {
        super(ConsultationVisit.class, forVariable(variable));
    }

    public QConsultationVisit(Path<? extends ConsultationVisit> path) {
        super(path.getType(), path.getMetadata());
    }

    public QConsultationVisit(PathMetadata metadata) {
        super(ConsultationVisit.class, metadata);
    }

}

