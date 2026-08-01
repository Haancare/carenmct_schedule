package com.carenmct.schedule.domain.schedule.copay;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_non_benefit_facility_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NonBenefitFacilityCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static NonBenefitFacilityCategory create(String facilityId, String label, int sortOrder) {
        NonBenefitFacilityCategory entity = new NonBenefitFacilityCategory();
        LocalDateTime now = LocalDateTime.now();
        entity.facilityId = facilityId;
        entity.label = label;
        entity.sortOrder = sortOrder;
        entity.createdAt = now;
        entity.updatedAt = now;
        return entity;
    }
}
