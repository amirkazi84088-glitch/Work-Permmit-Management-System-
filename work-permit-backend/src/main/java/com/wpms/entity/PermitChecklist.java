package com.wpms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "permit_checklists")
public class PermitChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "permit_type_id", nullable = false)
    private PermitType permitType;

    @Column(name = "checklist_item", nullable = false, length = 255)
    private String checklistItem;

    @Column(nullable = false)
    private Boolean mandatory = Boolean.TRUE;

    public Long getId() {
        return id;
    }

    public PermitType getPermitType() {
        return permitType;
    }

    public void setPermitType(PermitType permitType) {
        this.permitType = permitType;
    }

    public String getChecklistItem() {
        return checklistItem;
    }

    public void setChecklistItem(String checklistItem) {
        this.checklistItem = checklistItem;
    }

    public Boolean getMandatory() {
        return mandatory;
    }

    public void setMandatory(Boolean mandatory) {
        this.mandatory = mandatory;
    }
}
