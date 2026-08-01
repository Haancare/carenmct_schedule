package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QFacilitySubCategory is a Querydsl query type for FacilitySubCategory
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFacilitySubCategory extends EntityPathBase<FacilitySubCategory> {

    private static final long serialVersionUID = 131422363L;

    public static final QFacilitySubCategory facilitySubCategory = new QFacilitySubCategory("facilitySubCategory");

    public final StringPath category = createString("category");

    public final StringPath facilityId = createString("facilityId");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public QFacilitySubCategory(String variable) {
        super(FacilitySubCategory.class, forVariable(variable));
    }

    public QFacilitySubCategory(Path<? extends FacilitySubCategory> path) {
        super(path.getType(), path.getMetadata());
    }

    public QFacilitySubCategory(PathMetadata metadata) {
        super(FacilitySubCategory.class, metadata);
    }

}

