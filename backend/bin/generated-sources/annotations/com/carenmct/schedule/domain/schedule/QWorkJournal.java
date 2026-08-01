package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QWorkJournal is a Querydsl query type for WorkJournal
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QWorkJournal extends EntityPathBase<WorkJournal> {

    private static final long serialVersionUID = -1916976862L;

    public static final QWorkJournal workJournal = new QWorkJournal("workJournal");

    public final NumberPath<Long> consultationVisitId = createNumber("consultationVisitId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> createdBy = createNumber("createdBy", Long.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> employeeId = createNumber("employeeId", Long.class);

    public final StringPath facilityId = createString("facilityId");

    public final StringPath formData = createString("formData");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.JournalStatus> journalStatus = createEnum("journalStatus", com.carenmct.schedule.domain.schedule.enums.JournalStatus.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> updatedBy = createNumber("updatedBy", Long.class);

    public final DatePath<java.time.LocalDate> writtenDate = createDate("writtenDate", java.time.LocalDate.class);

    public QWorkJournal(String variable) {
        super(WorkJournal.class, forVariable(variable));
    }

    public QWorkJournal(Path<? extends WorkJournal> path) {
        super(path.getType(), path.getMetadata());
    }

    public QWorkJournal(PathMetadata metadata) {
        super(WorkJournal.class, metadata);
    }

}

