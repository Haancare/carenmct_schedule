package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QComGroupMember is a Querydsl query type for ComGroupMember
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComGroupMember extends EntityPathBase<ComGroupMember> {

    private static final long serialVersionUID = -1122087464L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QComGroupMember comGroupMember = new QComGroupMember("comGroupMember");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final QComGroup group;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> memberId = createNumber("memberId", Long.class);

    public final StringPath memberType = createString("memberType");

    public final QComGroupSubgroup subgroup;

    public QComGroupMember(String variable) {
        this(ComGroupMember.class, forVariable(variable), INITS);
    }

    public QComGroupMember(Path<? extends ComGroupMember> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QComGroupMember(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QComGroupMember(PathMetadata metadata, PathInits inits) {
        this(ComGroupMember.class, metadata, inits);
    }

    public QComGroupMember(Class<? extends ComGroupMember> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.group = inits.isInitialized("group") ? new QComGroup(forProperty("group"), inits.get("group")) : null;
        this.subgroup = inits.isInitialized("subgroup") ? new QComGroupSubgroup(forProperty("subgroup"), inits.get("subgroup")) : null;
    }

}

