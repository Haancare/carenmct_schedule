package com.carenmct.schedule.domain.schedule.copay;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNonBenefitFacilityCategory is a Querydsl query type for NonBenefitFacilityCategory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNonBenefitFacilityCategory extends EntityPathBase<NonBenefitFacilityCategory> {

    private static final long serialVersionUID = 164666785L;

    public static final QNonBenefitFacilityCategory nonBenefitFacilityCategory = new QNonBenefitFacilityCategory("nonBenefitFacilityCategory");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath facilityId = createString("facilityId");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath label = createString("label");

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QNonBenefitFacilityCategory(String variable) {
        super(NonBenefitFacilityCategory.class, forVariable(variable));
    }

    public QNonBenefitFacilityCategory(Path<? extends NonBenefitFacilityCategory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNonBenefitFacilityCategory(PathMetadata metadata) {
        super(NonBenefitFacilityCategory.class, metadata);
    }

}

