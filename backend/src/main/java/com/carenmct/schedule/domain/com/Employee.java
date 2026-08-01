package com.carenmct.schedule.domain.com;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "employees")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String nickname;

    @Column(length = 255)
    private String rrn;

    @Column
    private LocalDate dob;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(length = 20)
    private String department;

    @Column(length = 10)
    private String role;

    @Column(length = 10)
    private String position;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "retire_date")
    private LocalDate retireDate;

    @Column(name = "home_phone", length = 20)
    private String homePhone;

    @Column(length = 20)
    private String mobile;

    @Column(name = "mobile_country_code", length = 10)
    private String mobileCountryCode;

    @Column(length = 100)
    private String email;

    @Column(name = "zip_code", length = 10)
    private String zipCode;

    @Column(length = 200)
    private String address;

    @Column(name = "address_detail", length = 100)
    private String addressDetail;

    @Column(name = "bank_name", length = 30)
    private String bankName;

    @Column(name = "account_number", length = 30)
    private String accountNumber;

    @Column(name = "account_holder", length = 50)
    private String accountHolder;

    @Column(name = "salary_type", length = 10)
    private String salaryType;

    @Column(name = "has_inji_education", nullable = false)
    private Boolean hasInjiEducation;

    @Column(name = "is_foreigner", nullable = false)
    private Boolean foreigner;

    @Column(length = 50)
    private String nationality;

    @Column(name = "nationality_code", length = 10)
    private String nationalityCode;

    @Column(name = "english_name", length = 100)
    private String englishName;

    @Column(name = "visa_type", length = 30)
    private String visaType;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
