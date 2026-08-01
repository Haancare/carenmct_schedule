package com.carenmct.schedule.domain.schedule.reference;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_annual_fee_rate_services")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnnualFeeRateServiceHeader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "benefit_year", nullable = false)
    private Integer benefitYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;

    @Column(length = 500)
    private String note;

    @Column(name = "partial_min_minutes")
    private Integer partialMinMinutes;

    @Column(name = "partial_max_minutes")
    private Integer partialMaxMinutes;

    @Column(name = "partial_rate", precision = 5, scale = 4)
    private BigDecimal partialRate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "header", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<AnnualFeeRateItem> items = new ArrayList<>();
}
