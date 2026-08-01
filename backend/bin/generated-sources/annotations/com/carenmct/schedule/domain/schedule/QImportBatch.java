package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QImportBatch is a Querydsl query type for ImportBatch
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QImportBatch extends EntityPathBase<ImportBatch> {

    private static final long serialVersionUID = 1095735505L;

    public static final QImportBatch importBatch = new QImportBatch("importBatch");

    public final DatePath<java.time.LocalDate> certExpiry = createDate("certExpiry", java.time.LocalDate.class);

    public final StringPath certName = createString("certName");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> createdBy = createNumber("createdBy", Long.class);

    public final StringPath errorLog = createString("errorLog");

    public final NumberPath<Integer> errorRows = createNumber("errorRows", Integer.class);

    public final StringPath facilityId = createString("facilityId");

    public final DateTimePath<java.time.LocalDateTime> finishedAt = createDateTime("finishedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath importType = createString("importType");

    public final NumberPath<Integer> serviceMonth = createNumber("serviceMonth", Integer.class);

    public final NumberPath<Integer> serviceYear = createNumber("serviceYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> startedAt = createDateTime("startedAt", java.time.LocalDateTime.class);

    public final StringPath status = createString("status");

    public final NumberPath<Integer> successRows = createNumber("successRows", Integer.class);

    public final NumberPath<Integer> totalRows = createNumber("totalRows", Integer.class);

    public QImportBatch(String variable) {
        super(ImportBatch.class, forVariable(variable));
    }

    public QImportBatch(Path<? extends ImportBatch> path) {
        super(path.getType(), path.getMetadata());
    }

    public QImportBatch(PathMetadata metadata) {
        super(ImportBatch.class, metadata);
    }

}

