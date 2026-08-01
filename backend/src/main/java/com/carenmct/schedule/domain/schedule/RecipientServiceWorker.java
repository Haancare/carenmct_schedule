package com.carenmct.schedule.domain.schedule;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sch_recipient_service_workers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipientServiceWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ServiceType serviceType;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "family_relation", length = 20)
    private String familyRelation;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static RecipientServiceWorker create(
            Long recipientId,
            ServiceType serviceType,
            Long employeeId,
            String familyRelation,
            int sortOrder) {
        RecipientServiceWorker row = new RecipientServiceWorker();
        row.recipientId = recipientId;
        row.serviceType = serviceType;
        row.employeeId = employeeId;
        row.familyRelation = familyRelation;
        row.sortOrder = sortOrder;
        LocalDateTime now = LocalDateTime.now();
        row.createdAt = now;
        row.updatedAt = now;
        return row;
    }
}
