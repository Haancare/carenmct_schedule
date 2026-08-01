package com.carenmct.schedule.domain.schedule.copay;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCopayConfirmation is a Querydsl query type for CopayConfirmation
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCopayConfirmation extends EntityPathBase<CopayConfirmation> {

    private static final long serialVersionUID = -339992933L;

    public static final QCopayConfirmation copayConfirmation = new QCopayConfirmation("copayConfirmation");

    public final NumberPath<Integer> benefitTotal = createNumber("benefitTotal", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> confirmedAt = createDateTime("confirmedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> confirmedBy = createNumber("confirmedBy", Long.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.CopayConfirmType> confirmType = createEnum("confirmType", com.carenmct.schedule.domain.schedule.enums.CopayConfirmType.class);

    public final NumberPath<Integer> copayAmount = createNumber("copayAmount", Integer.class);

    public final NumberPath<java.math.BigDecimal> copayRateSnapshot = createNumber("copayRateSnapshot", java.math.BigDecimal.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath facilityId = createString("facilityId");

    public final NumberPath<Integer> gradeNum = createNumber("gradeNum", Integer.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Integer> insuranceAmount = createNumber("insuranceAmount", Integer.class);

    public final NumberPath<Integer> limitExcessAmount = createNumber("limitExcessAmount", Integer.class);

    public final StringPath periodKey = createString("periodKey");

    public final NumberPath<Long> recipientId = createNumber("recipientId", Long.class);

    public final StringPath reductionSnapshot = createString("reductionSnapshot");

    public final NumberPath<Integer> serviceCount = createNumber("serviceCount", Integer.class);

    public final NumberPath<Integer> serviceMonth = createNumber("serviceMonth", Integer.class);

    public final EnumPath<com.carenmct.schedule.domain.schedule.enums.ServiceType> serviceType = createEnum("serviceType", com.carenmct.schedule.domain.schedule.enums.ServiceType.class);

    public final NumberPath<Integer> serviceYear = createNumber("serviceYear", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public QCopayConfirmation(String variable) {
        super(CopayConfirmation.class, forVariable(variable));
    }

    public QCopayConfirmation(Path<? extends CopayConfirmation> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCopayConfirmation(PathMetadata metadata) {
        super(CopayConfirmation.class, metadata);
    }

}

