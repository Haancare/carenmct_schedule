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
@Table(name = "sch_non_benefit_charges")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NonBenefitCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "service_year", nullable = false)
    private Integer serviceYear;

    @Column(name = "service_month", nullable = false)
    private Integer serviceMonth;

    @Column(name = "meal_amount", nullable = false)
    private Integer mealAmount;

    @Column(name = "room_amount", nullable = false)
    private Integer roomAmount;

    @Column(name = "beauty_amount", nullable = false)
    private Integer beautyAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static NonBenefitCharge create(
            Long recipientId, int serviceYear, int serviceMonth, int meal, int room, int beauty) {
        NonBenefitCharge entity = new NonBenefitCharge();
        LocalDateTime now = LocalDateTime.now();
        entity.recipientId = recipientId;
        entity.serviceYear = serviceYear;
        entity.serviceMonth = serviceMonth;
        entity.mealAmount = meal;
        entity.roomAmount = room;
        entity.beautyAmount = beauty;
        entity.createdAt = now;
        entity.updatedAt = now;
        return entity;
    }

    public void updateFixedAmounts(int meal, int room, int beauty) {
        this.mealAmount = meal;
        this.roomAmount = room;
        this.beautyAmount = beauty;
        this.updatedAt = LocalDateTime.now();
    }
}
