package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipientAssignedWorker is a Querydsl query type for RecipientAssignedWorker
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipientAssignedWorker extends EntityPathBase<RecipientAssignedWorker> {

    private static final long serialVersionUID = -2083758779L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipientAssignedWorker recipientAssignedWorker = new QRecipientAssignedWorker("recipientAssignedWorker");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final QEmployee employee;

    public final BooleanPath family = createBoolean("family");

    public final StringPath familyRelation = createString("familyRelation");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QRecipient recipient;

    public QRecipientAssignedWorker(String variable) {
        this(RecipientAssignedWorker.class, forVariable(variable), INITS);
    }

    public QRecipientAssignedWorker(Path<? extends RecipientAssignedWorker> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipientAssignedWorker(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipientAssignedWorker(PathMetadata metadata, PathInits inits) {
        this(RecipientAssignedWorker.class, metadata, inits);
    }

    public QRecipientAssignedWorker(Class<? extends RecipientAssignedWorker> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.employee = inits.isInitialized("employee") ? new QEmployee(forProperty("employee"), inits.get("employee")) : null;
        this.recipient = inits.isInitialized("recipient") ? new QRecipient(forProperty("recipient"), inits.get("recipient")) : null;
    }

}

