package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QComGroupSubgroup is a Querydsl query type for ComGroupSubgroup
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComGroupSubgroup extends EntityPathBase<ComGroupSubgroup> {

    private static final long serialVersionUID = -1712059395L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QComGroupSubgroup comGroupSubgroup = new QComGroupSubgroup("comGroupSubgroup");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final QComGroup group;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath name = createString("name");

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public QComGroupSubgroup(String variable) {
        this(ComGroupSubgroup.class, forVariable(variable), INITS);
    }

    public QComGroupSubgroup(Path<? extends ComGroupSubgroup> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QComGroupSubgroup(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QComGroupSubgroup(PathMetadata metadata, PathInits inits) {
        this(ComGroupSubgroup.class, metadata, inits);
    }

    public QComGroupSubgroup(Class<? extends ComGroupSubgroup> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.group = inits.isInitialized("group") ? new QComGroup(forProperty("group"), inits.get("group")) : null;
    }

}

