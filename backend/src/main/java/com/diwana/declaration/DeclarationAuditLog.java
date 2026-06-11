package com.diwana.declaration;

import com.diwana.user.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class DeclarationAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declaration_id", nullable = false)
    private Declaration declaration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(30)")
    private Action action;

    @Column(name = "from_status")
    private String fromStatus;

    @Column(name = "to_status")
    private String toStatus;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum Action {
        CREATED, UPDATED, SUBMITTED, APPROVED, REJECTED, RESUBMITTED, INFO_REQUESTED, DELETED,
        LINE_ADDED, LINE_EDITED, LINE_DELETED
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Declaration getDeclaration() { return declaration; }
    public void setDeclaration(Declaration declaration) { this.declaration = declaration; }

    public Action getAction() { return action; }
    public void setAction(Action action) { this.action = action; }

    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String fromStatus) { this.fromStatus = fromStatus; }

    public String getToStatus() { return toStatus; }
    public void setToStatus(String toStatus) { this.toStatus = toStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}