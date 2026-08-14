package com.carenmct.schedule.domain.com;

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

/** 통합관리 — 수급자-가족관계 요양보호사 (`recipient_family_workers`) */
@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "recipient_family_workers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipientFamilyWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "family_relation", nullable = false, length = 30)
    private String familyRelation;

    @Column(name = "self_copay_deduction", nullable = false)
    private Boolean selfCopayDeduction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
