package com.carenmct.schedule.domain.schedule.copay;

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
@Table(name = "sch_non_benefit_other_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NonBenefitOtherItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "non_benefit_id", nullable = false)
    private Long nonBenefitId;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(nullable = false)
    private Integer amount;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    public static NonBenefitOtherItem create(Long nonBenefitId, String label, int amount, int sortOrder) {
        NonBenefitOtherItem entity = new NonBenefitOtherItem();
        entity.nonBenefitId = nonBenefitId;
        entity.label = label;
        entity.amount = amount;
        entity.sortOrder = sortOrder;
        return entity;
    }

    public void updateAmount(int amount) {
        this.amount = amount;
    }
}
