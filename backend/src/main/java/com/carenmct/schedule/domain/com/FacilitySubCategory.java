package com.carenmct.schedule.domain.com;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "facility_sub_categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FacilitySubCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false, length = 20)
    private String facilityId;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
