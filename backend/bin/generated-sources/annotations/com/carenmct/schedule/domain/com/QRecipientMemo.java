package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipientMemo is a Querydsl query type for RecipientMemo
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipientMemo extends EntityPathBase<RecipientMemo> {

    private static final long serialVersionUID = 1121690323L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipientMemo recipientMemo = new QRecipientMemo("recipientMemo");

    public final QUser author;

    public final StringPath content = createString("content");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final BooleanPath pinned = createBoolean("pinned");

    public final QRecipient recipient;

    public final StringPath serviceMonth = createString("serviceMonth");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QRecipientMemo(String variable) {
        this(RecipientMemo.class, forVariable(variable), INITS);
    }

    public QRecipientMemo(Path<? extends RecipientMemo> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipientMemo(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipientMemo(PathMetadata metadata, PathInits inits) {
        this(RecipientMemo.class, metadata, inits);
    }

    public QRecipientMemo(Class<? extends RecipientMemo> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.author = inits.isInitialized("author") ? new QUser(forProperty("author"), inits.get("author")) : null;
        this.recipient = inits.isInitialized("recipient") ? new QRecipient(forProperty("recipient"), inits.get("recipient")) : null;
    }

}

