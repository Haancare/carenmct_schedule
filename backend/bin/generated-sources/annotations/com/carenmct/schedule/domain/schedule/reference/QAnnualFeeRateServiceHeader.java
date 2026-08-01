package com.carenmct.schedule.domain.schedule.reference;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAnnualFeeRateServiceHeader is a Querydsl query type for AnnualFeeRateServiceHeader
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAnnualFeeRateServiceHeader extends EntityPathBase<AnnualFeeRateServiceHeader> {

    private static final long serialVersionUID = 844268546L;

    public static final QAnnualFeeRateServiceHeader annualFeeRateServiceHeader = new QAnnualFeeRateServiceHeader("annualFeeRateServiceHeader");

    public final NumberPath<Integer> benefitYear = createNumber("benefitYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final ListPath<AnnualFeeRateItem, QAnnualFeeRateItem> items = this.<AnnualFeeRateItem, QAnnualFeeRateItem>createList("items", AnnualFeeRateItem.class, QAnnualFeeRateItem.class, PathInits.DIRECT2);

    public final StringPath note = createString("note");

    public final NumberPath<Integer> partialMaxMinutes = createNumber("partialMaxMinutes", Integer.class);

    public final NumberPath<Integer> partialMinMinutes = createNumber("partialMinMinutes", Integer.class);

    public final NumberPath<java.math.BigDecimal> partialRate = createNumber("partialRate", java.math.BigDecimal.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ServiceType> serviceType = createEnum("serviceType", com.carenmct.schedule.domain.schedule.enums.ServiceType.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QAnnualFeeRateServiceHeader(String variable) {
        super(AnnualFeeRateServiceHeader.class, forVariable(variable));
    }

    public QAnnualFeeRateServiceHeader(Path<? extends AnnualFeeRateServiceHeader> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAnnualFeeRateServiceHeader(PathMetadata metadata) {
        super(AnnualFeeRateServiceHeader.class, metadata);
    }

}

