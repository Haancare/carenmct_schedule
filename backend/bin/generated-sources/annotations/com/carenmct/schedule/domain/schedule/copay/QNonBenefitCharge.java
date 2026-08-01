package com.carenmct.schedule.domain.schedule.copay;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QNonBenefitCharge is a Querydsl query type for NonBenefitCharge
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QNonBenefitCharge extends EntityPathBase<NonBenefitCharge> {

    private static final long serialVersionUID = -1801380972L;

    public static final QNonBenefitCharge nonBenefitCharge = new QNonBenefitCharge("nonBenefitCharge");

    public final NumberPath<Integer> beautyAmount = createNumber("beautyAmount", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> mealAmount = createNumber("mealAmount", Integer.class);

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final NumberPath<Integer> roomAmount = createNumber("roomAmount", Integer.class);

    public final NumberPath<Integer> serviceMonth = createNumber("serviceMonth", Integer.class);

    public final NumberPath<Integer> serviceYear = createNumber("serviceYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QNonBenefitCharge(String variable) {
        super(NonBenefitCharge.class, forVariable(variable));
    }

    public QNonBenefitCharge(Path<? extends NonBenefitCharge> path) {
        super(path.getType(), path.getMetadata());
    }

    public QNonBenefitCharge(PathMetadata metadata) {
        super(NonBenefitCharge.class, metadata);
    }

}

