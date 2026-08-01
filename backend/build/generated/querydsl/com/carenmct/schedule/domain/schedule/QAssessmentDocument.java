package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAssessmentDocument is a Querydsl query type for AssessmentDocument
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAssessmentDocument extends EntityPathBase<AssessmentDocument> {

    private static final long serialVersionUID = -1892767679L;

    public static final QAssessmentDocument assessmentDocument = new QAssessmentDocument("assessmentDocument");

    public final NumberPath<Long> authorId = createNumber("authorId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> createdBy = createNumber("createdBy", Long.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.AssessmentDocType> docType = createEnum("docType", com.carenmct.schedule.domain.schedule.enums.AssessmentDocType.class);

    public final NumberPath<Long> employeeId = createNumber("employeeId", Long.class);

    public final StringPath facilityId = createString("facilityId");

    public final StringPath formData = createString("formData");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> updatedBy = createNumber("updatedBy", Long.class);

    public final DatePath<java.time.LocalDate> writtenDate = createDate("writtenDate", java.time.LocalDate.class);

    public QAssessmentDocument(String variable) {
        super(AssessmentDocument.class, forVariable(variable));
    }

    public QAssessmentDocument(Path<? extends AssessmentDocument> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAssessmentDocument(PathMetadata metadata) {
        super(AssessmentDocument.class, metadata);
    }

}

