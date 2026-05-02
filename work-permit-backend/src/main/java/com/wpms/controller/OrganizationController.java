package com.wpms.controller;

import com.wpms.dto.ApiResponse;
import com.wpms.dto.DepartmentRequestDTO;
import com.wpms.dto.DepartmentResponseDTO;
import com.wpms.dto.OrganizationRequestDTO;
import com.wpms.dto.OrganizationResponseDTO;
import com.wpms.dto.PagedResponseDTO;
import com.wpms.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<PagedResponseDTO<OrganizationResponseDTO>> getOrganizations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search
    ) {
        return ApiResponse.success("Organizations fetched successfully", organizationService.getOrganizations(page, size, search));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<OrganizationResponseDTO> getOrganization(@PathVariable Long id) {
        return ApiResponse.success("Organization fetched successfully", organizationService.getOrganization(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<OrganizationResponseDTO> createOrganization(@Valid @RequestBody OrganizationRequestDTO request) {
        return ApiResponse.success("Organization created successfully", organizationService.createOrganization(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<OrganizationResponseDTO> updateOrganization(@PathVariable Long id, @Valid @RequestBody OrganizationRequestDTO request) {
        return ApiResponse.success("Organization updated successfully", organizationService.updateOrganization(id, request));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<OrganizationResponseDTO> toggleStatus(@PathVariable Long id) {
        return ApiResponse.success("Organization status updated successfully", organizationService.toggleOrganizationStatus(id));
    }

    @GetMapping("/{organizationId}/departments")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<List<DepartmentResponseDTO>> getDepartments(@PathVariable Long organizationId, Authentication authentication) {
        return ApiResponse.success("Departments fetched successfully", organizationService.getDepartmentsForUser(organizationId, authentication.getName()));
    }

    @PostMapping("/{organizationId}/departments")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<DepartmentResponseDTO> createDepartment(
            @PathVariable Long organizationId,
            @Valid @RequestBody DepartmentRequestDTO request,
            Authentication authentication
    ) {
        return ApiResponse.success("Department created successfully", organizationService.createDepartmentForUser(organizationId, request, authentication.getName()));
    }

    @PutMapping("/{organizationId}/departments/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<DepartmentResponseDTO> updateDepartment(
            @PathVariable Long organizationId,
            @PathVariable Long departmentId,
            @Valid @RequestBody DepartmentRequestDTO request,
            Authentication authentication
    ) {
        return ApiResponse.success("Department updated successfully", organizationService.updateDepartmentForUser(organizationId, departmentId, request, authentication.getName()));
    }

    @DeleteMapping("/{organizationId}/departments/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public ApiResponse<Void> deleteDepartment(
            @PathVariable Long organizationId,
            @PathVariable Long departmentId,
            Authentication authentication
    ) {
        organizationService.deleteDepartmentForUser(organizationId, departmentId, authentication.getName());
        return ApiResponse.success("Department deleted successfully", null);
    }
}
