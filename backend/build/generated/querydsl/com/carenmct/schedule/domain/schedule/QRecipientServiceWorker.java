package com.carenmct.schedule.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QRecipientServiceWorker is a Querydsl query type for RecipientServiceWorker
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipientServiceWorker extends EntityPathBase<RecipientServiceWorker> {

    private static final long serialVersionUID = 1863546174L;

    public static final QRecipientServiceWorker recipientServiceWorker = new QRecipientServiceWorker("recipientServiceWorker");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> employeeId = createNumber("employeeId", Long.class);

    public final StringPath familyRelation = createString("familyRelation");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ServiceType> serviceType = createEnum("serviceType", com.carenmct.schedule.domain.schedule.enums.ServiceType.class);

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QRecipientServiceWorker(String variable) {
        super(RecipientServiceWorker.class, forVariable(variable));
    }

    public QRecipientServiceWorker(Path<? extends RecipientServiceWorker> path) {
        super(path.getType(), path.getMetadata());
    }

    public QRecipientServiceWorker(PathMetadata metadata) {
        super(RecipientServiceWorker.class, metadata);
    }

}

