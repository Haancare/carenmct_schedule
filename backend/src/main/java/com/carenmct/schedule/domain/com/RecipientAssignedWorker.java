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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "recipient_assigned_workers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipientAssignedWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Recipient recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "is_family", nullable = false)
    private Boolean family;

    @Column(name = "family_relation", length = 20)
    private String familyRelation;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
