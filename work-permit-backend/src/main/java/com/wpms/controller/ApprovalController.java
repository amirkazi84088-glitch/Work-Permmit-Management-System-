package com.wpms.controller;

import com.wpms.dto.ApprovalDecisionDTO;
import com.wpms.dto.PermitResponseDTO;
import com.wpms.service.ApprovalService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("hasAnyRole('SUPERVISOR','SAFETY_OFFICER','PERMIT_APPROVER')")
public class ApprovalController {

    private final ApprovalService approvalService;

    public ApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    @GetMapping("/queue")
    public List<PermitResponseDTO> getQueue(Authentication authentication) {
        return approvalService.getQueue(authentication.getName());
    }

    @PostMapping({"/{permitId}/decision", "/{permitId}/decide"})
    public PermitResponseDTO decide(
            @PathVariable Long permitId,
            @Valid @RequestBody ApprovalDecisionDTO request,
            Authentication authentication
    ) {
        return approvalService.decide(permitId, authentication.getName(), request);
    }
}
