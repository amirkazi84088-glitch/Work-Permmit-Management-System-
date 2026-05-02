package com.wpms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "permit_approvals")
public class PermitApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "permit_id", nullable = false)
    private Permit permit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PermitStatus decision;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_role", nullable = false, length = 50)
    private RoleType approverRole;

    @Column(name = "approval_level", nullable = false)
    private Integer approvalLevel;

    @Column(length = 500)
    private String comments;

    @Column(name = "decision_at", nullable = false)
    private LocalDateTime decisionAt;

    @PrePersist
    public void prePersist() {
        if (decisionAt == null) {
            decisionAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Permit getPermit() {
        return permit;
    }

    public void setPermit(Permit permit) {
        this.permit = permit;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
    }

    public PermitStatus getDecision() {
        return decision;
    }

    public void setDecision(PermitStatus decision) {
        this.decision = decision;
    }

    public RoleType getApproverRole() {
        return approverRole;
    }

    public void setApproverRole(RoleType approverRole) {
        this.approverRole = approverRole;
    }

    public Integer getApprovalLevel() {
        return approvalLevel;
    }

    public void setApprovalLevel(Integer approvalLevel) {
        this.approvalLevel = approvalLevel;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getDecisionAt() {
        return decisionAt;
    }
}
