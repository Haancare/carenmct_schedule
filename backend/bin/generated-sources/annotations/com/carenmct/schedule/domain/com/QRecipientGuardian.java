package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipientGuardian is a Querydsl query type for RecipientGuardian
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipientGuardian extends EntityPathBase<RecipientGuardian> {

    private static final long serialVersionUID = 517198506L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipientGuardian recipientGuardian = new QRecipientGuardian("recipientGuardian");

    public final StringPath address = createString("address");

    public final StringPath addressDetail = createString("addressDetail");

    public final StringPath homePhone = createString("homePhone");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath mobile = createString("mobile");

    public final BooleanPath mobileKakao = createBoolean("mobileKakao");

    public final StringPath name = createString("name");

    public final QRecipient recipient;

    public final StringPath relation = createString("relation");

    public final StringPath relationDirect = createString("relationDirect");

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public final StringPath zipCode = createString("zipCode");

    public QRecipientGuardian(String variable) {
        this(RecipientGuardian.class, forVariable(variable), INITS);
    }

    public QRecipientGuardian(Path<? extends RecipientGuardian> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipientGuardian(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipientGuardian(PathMetadata metadata, PathInits inits) {
        this(RecipientGuardian.class, metadata, inits);
    }

    public QRecipientGuardian(Class<? extends RecipientGuardian> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.recipient = inits.isInitialized("recipient") ? new QRecipient(forProperty("recipient"), inits.get("recipient")) : null;
    }

}

