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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "recipient_guardians")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipientGuardian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Recipient recipient;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(length = 50)
    private String name;

    @Column(length = 50)
    private String relation;

    @Column(name = "relation_direct", length = 50)
    private String relationDirect;

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
}
