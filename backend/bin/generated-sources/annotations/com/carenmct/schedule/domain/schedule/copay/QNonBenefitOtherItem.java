package com.carenmct.schedule.domain.schedule.copay;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNonBenefitOtherItem is a Querydsl query type for NonBenefitOtherItem
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNonBenefitOtherItem extends EntityPathBase<NonBenefitOtherItem> {

    private static final long serialVersionUID = 1454915939L;

    public static final QNonBenefitOtherItem nonBenefitOtherItem = new QNonBenefitOtherItem("nonBenefitOtherItem");

    public final NumberPath<Integer> amount = createNumber("amount", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath label = createString("label");

    public final NumberPath<Long> nonBenefitId = createNumber("nonBenefitId", Long.class);

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public QNonBenefitOtherItem(String variable) {
        super(NonBenefitOtherItem.class, forVariable(variable));
    }

    public QNonBenefitOtherItem(Path<? extends NonBenefitOtherItem> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNonBenefitOtherItem(PathMetadata metadata) {
        super(NonBenefitOtherItem.class, metadata);
    }

}

