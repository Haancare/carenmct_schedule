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

/** 통합관리 {@code group_members} */
@Entity
@Table(catalog = ComDatabaseCatalog.NAME, name = "group_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ComGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ComGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subgroup_id")
    private ComGroupSubgroup subgroup;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_type", nullable = false, length = 10)
    private String memberType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
