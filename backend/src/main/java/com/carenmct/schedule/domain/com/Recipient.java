package com.carenmct.schedule.domain.com;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "recipients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Recipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @Column(length = 30)
    private String code;

    @Column(name = "contract_status", nullable = false, length = 20)
    private String contractStatus;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String alias;

    @Column(name = "legal_dob", nullable = false)
    private LocalDate legalDob;

    @Column(nullable = false, length = 1)
    private String gender;

    @Column(name = "real_dob")
    private LocalDate realDob;

    @Column(name = "real_dob_type", length = 1)
    private String realDobType;

    @Column(name = "cert_no", length = 30)
    private String certNo;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(nullable = false, length = 10)
    private String grade;

    @Column(nullable = false, length = 10)
    private String reduction;

    @Column(name = "approved_amt_care")
    private Integer approvedAmtCare;

    @Column(name = "approved_amt_bath")
    private Integer approvedAmtBath;

    @Column(name = "approved_amt_nursing")
    private Integer approvedAmtNursing;

    @Column(name = "approved_amt_day")
    private Integer approvedAmtDay;

    @Column(name = "approved_amt_other")
    private Integer approvedAmtOther;

    @Column(name = "home_phone", length = 20)
    private String homePhone;

    @Column(length = 20)
    private String mobile;

    @Column(name = "mobile_kakao", nullable = false)
    private Boolean mobileKakao;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(length = 200)
    private String address;

    @Column(name = "address_detail", length = 100)
    private String addressDetail;

    @Column(name = "contract_date")
    private LocalDate contractDate;

    @Column(name = "benefit_start_date")
    private LocalDate benefitStartDate;

    @Column(name = "contract_period_from")
    private LocalDate contractPeriodFrom;

    @Column(name = "contract_period_to")
    private LocalDate contractPeriodTo;

    @Column(name = "disease_memo", length = 500)
    private String diseaseMemo;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "medical_benefit_type", nullable = false, length = 10)
    private String medicalBenefitType;

    @Column(name = "medical_benefit_no", length = 30)
    private String medicalBenefitNo;

    @Column(name = "medical_benefit_note", length = 200)
    private String medicalBenefitNote;

    @Column(name = "registration_type", nullable = false, length = 10)
    private String registrationType;

    @Column(name = "import_batch_id")
    private Long importBatchId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    private List<RecipientService> services = new ArrayList<>();

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    private List<RecipientGuardian> guardians = new ArrayList<>();

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    private List<RecipientAssignedWorker> assignedWorkers = new ArrayList<>();

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    private List<RecipientMemo> memos = new ArrayList<>();
}
