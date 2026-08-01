package com.carenmct.schedule.domain.schedule.reference;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAnnualFeeRateItem is a Querydsl query type for AnnualFeeRateItem
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAnnualFeeRateItem extends EntityPathBase<AnnualFeeRateItem> {

    private static final long serialVersionUID = -1155480397L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QAnnualFeeRateItem annualFeeRateItem = new QAnnualFeeRateItem("annualFeeRateItem");

    public final NumberPath<Integer> amount = createNumber("amount", Integer.class);

    public final BooleanPath applyFamily = createBoolean("applyFamily");

    public final StringPath feeCode = createString("feeCode");

    public final NumberPath<Integer> grade1Amount = createNumber("grade1Amount", Integer.class);

    public final NumberPath<Integer> grade2Amount = createNumber("grade2Amount", Integer.class);

    public final NumberPath<Integer> grade3Amount = createNumber("grade3Amount", Integer.class);

    public final NumberPath<Integer> grade4Amount = createNumber("grade4Amount", Integer.class);

    public final NumberPath<Integer> grade5Amount = createNumber("grade5Amount", Integer.class);

    public final NumberPath<Integer> gradeCognitiveAmount = createNumber("gradeCognitiveAmount", Integer.class);

    public final QAnnualFeeRateServiceHeader header;

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath label = createString("label");

    public final BooleanPath maxInclusive = createBoolean("maxInclusive");

    public final NumberPath<Integer> maxMinutes = createNumber("maxMinutes", Integer.class);

    public final NumberPath<Integer> minMinutes = createNumber("minMinutes", Integer.class);

    public final NumberPath<Integer> sortOrder = createNumber("sortOrder", Integer.class);

    public QAnnualFeeRateItem(String variable) {
        this(AnnualFeeRateItem.class, forVariable(variable), INITS);
    }

    public QAnnualFeeRateItem(Path<? extends AnnualFeeRateItem> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QAnnualFeeRateItem(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QAnnualFeeRateItem(PathMetadata metadata, PathInits inits) {
        this(AnnualFeeRateItem.class, metadata, inits);
    }

    public QAnnualFeeRateItem(Class<? extends AnnualFeeRateItem> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.header = inits.isInitialized("header") ? new QAnnualFeeRateServiceHeader(forProperty("header")) : null;
    }

}

