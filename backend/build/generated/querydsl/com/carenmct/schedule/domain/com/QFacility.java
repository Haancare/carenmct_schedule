package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QFacility is a Querydsl query type for Facility
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFacility extends EntityPathBase<Facility> {

    private static final long serialVersionUID = 319694531L;

    public static final QFacility facility = new QFacility("facility");

    public final StringPath accountCode = createString("accountCode");

    public final StringPath activeMode = createString("activeMode");

    public final DatePath<java.time.LocalDate> activeUntil = createDate("activeUntil", java.time.LocalDate.class);

    public final StringPath address = createString("address");

    public final StringPath addressDetail = createString("addressDetail");

    public final StringPath alias = createString("alias");

    public final StringPath category = createString("category");

    public final StringPath code = createString("code");

    public final DatePath<java.time.LocalDate> contractEndDate = createDate("contractEndDate", java.time.LocalDate.class);

    public final StringPath contractEndReason = createString("contractEndReason");

    public final StringPath contractMemo = createString("contractMemo");

    public final DatePath<java.time.LocalDate> contractStartDate = createDate("contractStartDate", java.time.LocalDate.class);

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DatePath<java.time.LocalDate> designDate = createDate("designDate", java.time.LocalDate.class);

    public final StringPath email = createString("email");

    public final NumberPath<Integer> employees = createNumber("employees", Integer.class);

    public final StringPath fax = createString("fax");

    public final StringPath groupCode = createString("groupCode");

    public final StringPath himsId = createString("himsId");

    public final StringPath himsName = createString("himsName");

    public final StringPath id = createString("id");

    public final StringPath name = createString("name");

    public final DatePath<java.time.LocalDate> openDate = createDate("openDate", java.time.LocalDate.class);

    public final StringPath phone = createString("phone");

    public final StringPath regionId = createString("regionId");

    public final StringPath semuloveCode = createString("semuloveCode");

    public final BooleanPath svcFinance = createBoolean("svcFinance");

    public final BooleanPath svcInsurance = createBoolean("svcInsurance");

    public final BooleanPath svcProgram = createBoolean("svcProgram");

    public final BooleanPath svcTax = createBoolean("svcTax");

    public final StringPath taxInvoiceEmail = createString("taxInvoiceEmail");

    public final StringPath uniqueNum = createString("uniqueNum");

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final StringPath zipCode = createString("zipCode");

    public QFacility(String variable) {
        super(Facility.class, forVariable(variable));
    }

    public QFacility(Path<? extends Facility> path) {
        super(path.getType(), path.getMetadata());
    }

    public QFacility(PathMetadata metadata) {
        super(Facility.class, metadata);
    }

}

