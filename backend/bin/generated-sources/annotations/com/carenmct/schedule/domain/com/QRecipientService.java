package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipientService is a Querydsl query type for RecipientService
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipientService extends EntityPathBase<RecipientService> {

    private static final long serialVersionUID = -1829132676L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipientService recipientService = new QRecipientService("recipientService");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QRecipient recipient;

    public final StringPath serviceType = createString("serviceType");

    public QRecipientService(String variable) {
        this(RecipientService.class, forVariable(variable), INITS);
    }

    public QRecipientService(Path<? extends RecipientService> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipientService(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipientService(PathMetadata metadata, PathInits inits) {
        this(RecipientService.class, metadata, inits);
    }

    public QRecipientService(Class<? extends RecipientService> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipient = inits.isInitialized("recipient") ? new QRecipient(forProperty("recipient"), inits.get("recipient")) : null;
    }

}

