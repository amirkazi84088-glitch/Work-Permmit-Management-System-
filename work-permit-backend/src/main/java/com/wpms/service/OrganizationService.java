package com.wpms.service;

import com.wpms.dto.DepartmentRequestDTO;
import com.wpms.dto.DepartmentResponseDTO;
import com.wpms.dto.OrganizationRequestDTO;
import com.wpms.dto.OrganizationResponseDTO;
import com.wpms.dto.PagedResponseDTO;
import com.wpms.entity.Department;
import com.wpms.entity.Organization;
import com.wpms.entity.OrganizationStatus;
import com.wpms.entity.RoleType;
import com.wpms.entity.User;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.DepartmentRepository;
import com.wpms.repository.OrganizationRepository;
import com.wpms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponseDTO<OrganizationResponseDTO> getOrganizations(int page, int size, String search) {
        List<OrganizationResponseDTO> organizations = organizationRepository.findAll().stream()
                .filter(org -> search == null || search.isBlank()
                        || org.getName().toLowerCase().contains(search.toLowerCase())
                        || org.getCode().toLowerCase().contains(search.toLowerCase()))
                .map(this::toOrganizationDto)
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : size;
        int start = Math.min(safePage * safeSize, organizations.size());
        int end = Math.min(start + safeSize, organizations.size());
        List<OrganizationResponseDTO> content = organizations.subList(start, end);
        int totalPages = Math.max(1, (int) Math.ceil((double) organizations.size() / safeSize));

        return new PagedResponseDTO<>(
                content,
                organizations.size(),
                totalPages,
                safePage,
                safeSize,
                safePage == 0,
                safePage >= totalPages - 1
        );
    }

    @Transactional(readOnly = true)
    public OrganizationResponseDTO getOrganization(Long id) {
        return toOrganizationDto(getOrganizationEntity(id));
    }

    @Transactional
    public OrganizationResponseDTO createOrganization(OrganizationRequestDTO request) {
        organizationRepository.findByCodeIgnoreCase(request.getCode())
                .ifPresent(existing -> { throw new IllegalArgumentException("Organization code already exists: " + request.getCode()); });

        Organization organization = new Organization();
        applyOrganizationRequest(organization, request);
        organization = organizationRepository.save(organization);
        auditLogService.log(null, "ORGANIZATION", "Created organization", organization.getId());
        return toOrganizationDto(organization);
    }

    @Transactional
    public OrganizationResponseDTO updateOrganization(Long id, OrganizationRequestDTO request) {
        Organization organization = getOrganizationEntity(id);
        organizationRepository.findByCodeIgnoreCase(request.getCode())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new IllegalArgumentException("Organization code already exists: " + request.getCode()); });

        applyOrganizationRequest(organization, request);
        organization = organizationRepository.save(organization);
        auditLogService.log(null, "ORGANIZATION", "Updated organization", organization.getId());
        return toOrganizationDto(organization);
    }

    @Transactional
    public OrganizationResponseDTO toggleOrganizationStatus(Long id) {
        Organization organization = getOrganizationEntity(id);
        organization.setStatus(organization.getStatus() == OrganizationStatus.ACTIVE ? OrganizationStatus.INACTIVE : OrganizationStatus.ACTIVE);
        organization = organizationRepository.save(organization);
        auditLogService.log(null, "ORGANIZATION", "Toggled organization status", organization.getId());
        return toOrganizationDto(organization);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getDepartments(Long organizationId) {
        getOrganizationEntity(organizationId);
        return departmentRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .map(this::toDepartmentDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> getDepartmentsForUser(Long organizationId, String userEmail) {
        validateDepartmentAccess(organizationId, userEmail);
        return getDepartments(organizationId);
    }

    @Transactional
    public DepartmentResponseDTO createDepartment(Long organizationId, DepartmentRequestDTO request) {
        Organization organization = getOrganizationEntity(organizationId);
        Department department = new Department();
        department.setOrganization(organization);
        applyDepartmentRequest(department, request);
        department = departmentRepository.save(department);
        auditLogService.log(null, "DEPARTMENT", "Created department", department.getId());
        return toDepartmentDto(departmentRepository.findWithDetailsById(department.getId()).orElseThrow());
    }

    @Transactional
    public DepartmentResponseDTO createDepartmentForUser(Long organizationId, DepartmentRequestDTO request, String userEmail) {
        validateDepartmentAccess(organizationId, userEmail);
        return createDepartment(organizationId, request);
    }

    @Transactional
    public DepartmentResponseDTO updateDepartment(Long organizationId, Long departmentId, DepartmentRequestDTO request) {
        getOrganizationEntity(organizationId);
        Department department = departmentRepository.findWithDetailsById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + departmentId));
        if (!department.getOrganization().getId().equals(organizationId)) {
            throw new IllegalArgumentException("Department does not belong to organization: " + organizationId);
        }
        applyDepartmentRequest(department, request);
        department = departmentRepository.save(department);
        auditLogService.log(null, "DEPARTMENT", "Updated department", department.getId());
        return toDepartmentDto(departmentRepository.findWithDetailsById(department.getId()).orElseThrow());
    }

    @Transactional
    public DepartmentResponseDTO updateDepartmentForUser(Long organizationId, Long departmentId, DepartmentRequestDTO request, String userEmail) {
        validateDepartmentAccess(organizationId, userEmail);
        return updateDepartment(organizationId, departmentId, request);
    }

    @Transactional
    public void deleteDepartment(Long organizationId, Long departmentId) {
        getOrganizationEntity(organizationId);
        Department department = departmentRepository.findWithDetailsById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + departmentId));
        if (!department.getOrganization().getId().equals(organizationId)) {
            throw new IllegalArgumentException("Department does not belong to organization: " + organizationId);
        }
        departmentRepository.delete(department);
        auditLogService.log(null, "DEPARTMENT", "Deleted department", departmentId);
    }

    @Transactional
    public void deleteDepartmentForUser(Long organizationId, Long departmentId, String userEmail) {
        validateDepartmentAccess(organizationId, userEmail);
        deleteDepartment(organizationId, departmentId);
    }

    private Organization getOrganizationEntity(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + id));
    }

    private void applyOrganizationRequest(Organization organization, OrganizationRequestDTO request) {
        organization.setName(request.getName().trim());
        organization.setCode(request.getCode().trim());
        organization.setAddress(request.getAddress());
        organization.setCity(request.getCity());
        organization.setCountry(request.getCountry());
        organization.setPhone(request.getPhone());
        organization.setEmail(request.getEmail());
        organization.setIndustry(request.getIndustry());
        organization.setStatus(request.getStatus() == null ? OrganizationStatus.ACTIVE : request.getStatus());
        organization.setMaxUsers(request.getMaxUsers());
        organization.setSubscriptionPlan(request.getSubscriptionPlan());
        organization.setSubscriptionExpiry(request.getSubscriptionExpiry());
    }

    private void applyDepartmentRequest(Department department, DepartmentRequestDTO request) {
        department.setName(request.getName().trim());
        department.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
        department.setManager(resolveManager(request.getManagerId()));
    }

    private User resolveManager(Long managerId) {
        if (managerId == null) {
            return null;
        }
        return userRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + managerId));
    }

    private void validateDepartmentAccess(Long organizationId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        boolean isSuperAdmin = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getRoleName() == RoleType.SUPER_ADMIN);
        if (isSuperAdmin) {
            return;
        }

        boolean isAdmin = user.getUserRoles().stream()
                .anyMatch(userRole -> userRole.getRole().getRoleName() == RoleType.ADMIN);
        Long userOrgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        if (!isAdmin || userOrgId == null || !userOrgId.equals(organizationId)) {
            throw new IllegalArgumentException("Department access denied for organization: " + organizationId);
        }
    }

    private OrganizationResponseDTO toOrganizationDto(Organization organization) {
        OrganizationResponseDTO dto = new OrganizationResponseDTO();
        dto.setId(organization.getId());
        dto.setName(organization.getName());
        dto.setCode(organization.getCode());
        dto.setAddress(organization.getAddress());
        dto.setCity(organization.getCity());
        dto.setCountry(organization.getCountry());
        dto.setPhone(organization.getPhone());
        dto.setEmail(organization.getEmail());
        dto.setIndustry(organization.getIndustry());
        dto.setStatus(organization.getStatus());
        dto.setMaxUsers(organization.getMaxUsers());
        dto.setCurrentUsers((int) userRepository.countByOrganizationId(organization.getId()));
        dto.setSubscriptionPlan(organization.getSubscriptionPlan());
        dto.setSubscriptionExpiry(organization.getSubscriptionExpiry());
        dto.setCreatedAt(organization.getCreatedAt());
        dto.setUpdatedAt(organization.getUpdatedAt());
        return dto;
    }

    private DepartmentResponseDTO toDepartmentDto(Department department) {
        DepartmentResponseDTO dto = new DepartmentResponseDTO();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setOrganizationId(department.getOrganization().getId());
        dto.setManagerId(department.getManager() != null ? department.getManager().getId() : null);
        dto.setManagerName(department.getManager() != null ? department.getManager().getName() : null);
        dto.setIsActive(department.getIsActive());
        return dto;
    }
}
