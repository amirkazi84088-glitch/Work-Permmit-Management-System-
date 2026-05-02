package com.wpms.dto;

import jakarta.validation.constraints.NotNull;

public class ApprovalDecisionDTO {

    @NotNull
    private Boolean approved;

    private String comments;

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
