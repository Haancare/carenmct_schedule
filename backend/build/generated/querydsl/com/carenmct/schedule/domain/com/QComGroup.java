package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QComGroup is a Querydsl query type for ComGroup
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComGroup extends EntityPathBase<ComGroup> {

    private static final long serialVersionUID = -818543202L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QComGroup comGroup = new QComGroup("comGroup");

    public final StringPath color = createString("color");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath description = createString("description");

    public final QFacility facility;

    public final BooleanPath hasSubgroups = createBoolean("hasSubgroups");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath name = createString("name");

    public final StringPath type = createString("type");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QComGroup(String variable) {
        this(ComGroup.class, forVariable(variable), INITS);
    }

    public QComGroup(Path<? extends ComGroup> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QComGroup(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QComGroup(PathMetadata metadata, PathInits inits) {
        this(ComGroup.class, metadata, inits);
    }

    public QComGroup(Class<? extends ComGroup> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.facility = inits.isInitialized("facility") ? new QFacility(forProperty("facility")) : null;
    }

}

