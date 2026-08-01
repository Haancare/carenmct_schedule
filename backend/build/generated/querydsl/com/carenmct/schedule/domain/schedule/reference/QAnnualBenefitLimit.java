package com.carenmct.schedule.domain.schedule.reference;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAnnualBenefitLimit is a Querydsl query type for AnnualBenefitLimit
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAnnualBenefitLimit extends EntityPathBase<AnnualBenefitLimit> {

    private static final long serialVersionUID = -48636502L;

    public static final QAnnualBenefitLimit annualBenefitLimit = new QAnnualBenefitLimit("annualBenefitLimit");

    public final NumberPath<Integer> benefitYear = createNumber("benefitYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> limitGrade1 = createNumber("limitGrade1", Integer.class);

    public final NumberPath<Integer> limitGrade2 = createNumber("limitGrade2", Integer.class);

    public final NumberPath<Integer> limitGrade3 = createNumber("limitGrade3", Integer.class);

    public final NumberPath<Integer> limitGrade4 = createNumber("limitGrade4", Integer.class);

    public final NumberPath<Integer> limitGrade5 = createNumber("limitGrade5", Integer.class);

    public final NumberPath<Integer> limitGradeCognitive = createNumber("limitGradeCognitive", Integer.class);

    public final StringPath note = createString("note");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QAnnualBenefitLimit(String variable) {
        super(AnnualBenefitLimit.class, forVariable(variable));
    }

    public QAnnualBenefitLimit(Path<? extends AnnualBenefitLimit> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAnnualBenefitLimit(PathMetadata metadata) {
        super(AnnualBenefitLimit.class, metadata);
    }

}

