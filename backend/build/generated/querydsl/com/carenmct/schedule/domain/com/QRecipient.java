package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRecipient is a Querydsl query type for Recipient
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRecipient extends EntityPathBase<Recipient> {

    private static final long serialVersionUID = -509035015L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRecipient recipient = new QRecipient("recipient");

    public final StringPath address = createString("address");

    public final StringPath addressDetail = createString("addressDetail");

    public final StringPath alias = createString("alias");

    public final NumberPath<Integer> approvedAmtBath = createNumber("approvedAmtBath", Integer.class);

    public final NumberPath<Integer> approvedAmtCare = createNumber("approvedAmtCare", Integer.class);

    public final NumberPath<Integer> approvedAmtDay = createNumber("approvedAmtDay", Integer.class);

    public final NumberPath<Integer> approvedAmtNursing = createNumber("approvedAmtNursing", Integer.class);

    public final NumberPath<Integer> approvedAmtOther = createNumber("approvedAmtOther", Integer.class);

    public final ListPath<RecipientAssignedWorker, QRecipientAssignedWorker> assignedWorkers = this.<RecipientAssignedWorker, QRecipientAssignedWorker>createList("assignedWorkers", RecipientAssignedWorker.class, QRecipientAssignedWorker.class, PathInits.DIRECT2);

    public final DatePath<java.time.LocalDate> benefitStartDate = createDate("benefitStartDate", java.time.LocalDate.class);

    public final StringPath certNo = createString("certNo");

    public final StringPath code = createString("code");

    public final DatePath<java.time.LocalDate> contractDate = createDate("contractDate", java.time.LocalDate.class);

    public final DatePath<java.time.LocalDate> contractPeriodFrom = createDate("contractPeriodFrom", java.time.LocalDate.class);

    public final DatePath<java.time.LocalDate> contractPeriodTo = createDate("contractPeriodTo", java.time.LocalDate.class);

    public final StringPath contractStatus = createString("contractStatus");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final StringPath diseaseMemo = createString("diseaseMemo");

    public final QFacility facility;

    public final StringPath gender = createString("gender");

    public final StringPath grade = createString("grade");

    public final ListPath<RecipientGuardian, QRecipientGuardian> guardians = this.<RecipientGuardian, QRecipientGuardian>createList("guardians", RecipientGuardian.class, QRecipientGuardian.class, PathInits.DIRECT2);

    public final StringPath homePhone = createString("homePhone");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> importBatchId = createNumber("importBatchId", Long.class);

    public final DatePath<java.time.LocalDate> legalDob = createDate("legalDob", java.time.LocalDate.class);

    public final StringPath medicalBenefitNo = createString("medicalBenefitNo");

    public final StringPath medicalBenefitNote = createString("medicalBenefitNote");

    public final StringPath medicalBenefitType = createString("medicalBenefitType");

    public final StringPath memo = createString("memo");

    public final ListPath<RecipientMemo, QRecipientMemo> memos = this.<RecipientMemo, QRecipientMemo>createList("memos", RecipientMemo.class, QRecipientMemo.class, PathInits.DIRECT2);

    public final StringPath mobile = createString("mobile");

    public final BooleanPath mobileKakao = createBoolean("mobileKakao");

    public final StringPath name = createString("name");

    public final StringPath photoUrl = createString("photoUrl");

    public final DatePath<java.time.LocalDate> realDob = createDate("realDob", java.time.LocalDate.class);

    public final StringPath realDobType = createString("realDobType");

    public final StringPath reduction = createString("reduction");

    public final StringPath registrationType = createString("registrationType");

    public final ListPath<RecipientService, QRecipientService> services = this.<RecipientService, QRecipientService>createList("services", RecipientService.class, QRecipientService.class, PathInits.DIRECT2);

    public final DateTimePath<java.time.LocalDateTime> updatedAt = createDateTime("updatedAt", java.time.LocalDateTime.class);

    public final DatePath<java.time.LocalDate> validFrom = createDate("validFrom", java.time.LocalDate.class);

    public final DatePath<java.time.LocalDate> validTo = createDate("validTo", java.time.LocalDate.class);

    public final StringPath zipCode = createString("zipCode");

    public QRecipient(String variable) {
        this(Recipient.class, forVariable(variable), INITS);
    }

    public QRecipient(Path<? extends Recipient> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRecipient(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRecipient(PathMetadata metadata, PathInits inits) {
        this(Recipient.class, metadata, inits);
    }

    public QRecipient(Class<? extends Recipient> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.facility = inits.isInitialized("facility") ? new QFacility(forProperty("facility")) : null;
    }

}

