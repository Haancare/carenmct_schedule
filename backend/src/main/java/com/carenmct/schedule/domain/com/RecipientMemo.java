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
@Table(catalog = ComDatabaseCatalog.NAME, name = "recipient_memos")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecipientMemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private Recipient recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private Boolean pinned;

    @Column(name = "service_month", length = 7)
    private String serviceMonth;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static RecipientMemo create(
            Recipient recipient, User author, String content, String serviceMonth, boolean pinned) {
        RecipientMemo memo = new RecipientMemo();
        memo.recipient = recipient;
        memo.author = author;
        memo.content = content.trim();
        memo.pinned = pinned;
        memo.serviceMonth = serviceMonth;
        LocalDateTime now = LocalDateTime.now();
        memo.createdAt = now;
        memo.updatedAt = now;
        return memo;
    }

    public void togglePinned() {
        this.pinned = !Boolean.TRUE.equals(this.pinned);
        this.updatedAt = LocalDateTime.now();
    }

    public void updateContent(String content) {
        this.content = content.trim();
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
