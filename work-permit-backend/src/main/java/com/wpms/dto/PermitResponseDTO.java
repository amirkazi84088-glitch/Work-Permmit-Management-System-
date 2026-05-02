package com.wpms.dto;

import com.wpms.entity.PermitStatus;

import java.time.LocalDateTime;

public class PermitResponseDTO {

    private Long id;
    private String permitNumber;
    private Long requesterId;
    private String requesterName;
    private Long permitTypeId;
    private String permitTypeName;
    private String title;
    private String description;
    private String location;
    private PermitStatus status;
    private LocalDateTime startDate;
    private LocalDateTime submittedAt;
    private LocalDateTime expiryAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPermitNumber() {
        return permitNumber;
    }

    public void setPermitNumber(String permitNumber) {
        this.permitNumber = permitNumber;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public Long getPermitTypeId() {
        return permitTypeId;
    }

    public void setPermitTypeId(Long permitTypeId) {
        this.permitTypeId = permitTypeId;
    }

    public String getPermitTypeName() {
        return permitTypeName;
    }

    public void setPermitTypeName(String permitTypeName) {
        this.permitTypeName = permitTypeName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public PermitStatus getStatus() {
        return status;
    }

    public void setStatus(PermitStatus status) {
        this.status = status;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getExpiryAt() {
        return expiryAt;
    }

    public void setExpiryAt(LocalDateTime expiryAt) {
        this.expiryAt = expiryAt;
    }
}
