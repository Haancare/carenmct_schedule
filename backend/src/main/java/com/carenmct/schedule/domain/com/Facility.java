package com.carenmct.schedule.domain.com;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "facilities")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Facility {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "account_code", length = 20)
    private String accountCode;

    @Column(name = "semulove_code", length = 4)
    private String semuloveCode;

    @Column(name = "group_code", length = 4)
    private String groupCode;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String alias;

    @Column(length = 20)
    private String code;

    @Column(name = "unique_num", length = 20)
    private String uniqueNum;

    @Column(length = 20)
    private String phone;

    @Column(length = 20)
    private String fax;

    @Column(length = 100)
    private String email;

    @Column(name = "region_id", length = 10)
    private String regionId;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(length = 200)
    private String address;

    @Column(name = "address_detail", length = 100)
    private String addressDetail;

    @Column(nullable = false)
    private Integer employees;

    @Column(name = "active_mode", nullable = false, length = 20)
    private String activeMode;

    @Column(name = "active_until")
    private LocalDate activeUntil;

    @Column(name = "open_date")
    private LocalDate openDate;

    @Column(name = "design_date")
    private LocalDate designDate;

    @Column(name = "hims_id", length = 50)
    private String himsId;

    @Column(name = "hims_name", length = 100)
    private String himsName;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "contract_end_reason", length = 30)
    private String contractEndReason;

    @Column(name = "contract_memo", columnDefinition = "TEXT")
    private String contractMemo;

    @Column(name = "svc_program", nullable = false)
    private Boolean svcProgram;

    @Column(name = "svc_tax", nullable = false)
    private Boolean svcTax;

    @Column(name = "svc_insurance", nullable = false)
    private Boolean svcInsurance;

    @Column(name = "svc_finance", nullable = false)
    private Boolean svcFinance;

    @Column(name = "tax_invoice_email", length = 100)
    private String taxInvoiceEmail;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
