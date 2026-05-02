package com.wpms.dto;

import java.util.List;

public class PermitTypeResponseDTO {

    private Long id;
    private String name;
    private String description;
    private List<String> checklistItems;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getChecklistItems() { return checklistItems; }
    public void setChecklistItems(List<String> checklistItems) { this.checklistItems = checklistItems; }
}
