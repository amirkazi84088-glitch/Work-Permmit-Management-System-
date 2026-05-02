package com.wpms.service;

import com.wpms.dto.CreateUserRequestDTO;
import com.wpms.dto.UpdateUserRequestDTO;
import com.wpms.dto.UserResponseDTO;
import com.wpms.entity.Department;
import com.wpms.entity.Organization;
import com.wpms.entity.Role;
import com.wpms.entity.RoleType;
import com.wpms.entity.User;
import com.wpms.entity.UserRole;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.DepartmentRepository;
import com.wpms.repository.OrganizationRepository;
import com.wpms.repository.RoleRepository;
import com.wpms.repository.UserRepository;
import com.wpms.repository.UserRoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            OrganizationRepository organizationRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public UserResponseDTO createUser(CreateUserRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRole()));

        User user = new User();
        user.setName(request.getName());
        user.setFirstName(firstNameFrom(request.getName()));
        user.setLastName(lastNameFrom(request.getName()));
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(true);
        user = userRepository.save(user);

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setPrimaryRole(true);
        userRoleRepository.save(userRole);

        auditLogService.log(user.getEmail(), "USER", "Created user", user.getId());
        return mapToDto(userRepository.findWithRolesById(user.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return mapToDto(user);
    }

    @Transactional
    public UserResponseDTO toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "USER", "Toggled user status", user.getId());
        return mapToDto(userRepository.findWithRolesById(userId).orElseThrow());
    }

    @Transactional(readOnly = true)
    public UserResponseDTO getUserById(Long userId) {
        return mapToDto(userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId)));
    }

    @Transactional
    public UserResponseDTO updateUser(Long userId, UpdateUserRequestDTO request) {
        User user = userRepository.findWithRolesById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (userRepository.existsByEmailAndIdNot(request.getEmail(), userId)) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        String firstName = blankToNull(request.getFirstName());
        String lastName = blankToNull(request.getLastName());
        if (firstName != null) {
            user.setFirstName(firstName);
        }
        if (lastName != null) {
            user.setLastName(lastName);
        }
        if (firstName != null || lastName != null) {
            user.setName(((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim());
        }
        user.setEmail(request.getEmail().trim());
        user.setPhone(blankToNull(request.getPhone()));
        user.setEmployeeId(blankToNull(request.getEmployeeId()));
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        user.setOrganization(resolveOrganization(request.getOrganizationId()));
        user.setDepartment(resolveDepartment(request.getDepartmentId(), user.getOrganization()));
        user = userRepository.save(user);

        if (request.getRole() != null) {
            replacePrimaryRole(user, request.getRole());
        }

        auditLogService.log(user.getEmail(), "USER", "Updated user", user.getId());
        return mapToDto(userRepository.findWithRolesById(user.getId()).orElseThrow());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        String email = user.getEmail();
        userRepository.delete(user);
        auditLogService.log(email, "USER", "Deleted user", userId);
    }

    @Transactional
    public void resetUserPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setPassword(passwordEncoder.encode("Test@1234"));
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "USER", "Reset user password", user.getId());
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getUsersByRole(RoleType role, Long organizationId) {
        List<User> users = organizationId == null
                ? userRepository.findDistinctByUserRolesRoleRoleName(role)
                : userRepository.findDistinctByUserRolesRoleRoleNameAndOrganizationId(role, organizationId);
        return users.stream().map(this::mapToDto).toList();
    }

    private UserResponseDTO mapToDto(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setOrganizationId(user.getOrganization() != null ? user.getOrganization().getId() : null);
        dto.setOrganizationName(user.getOrganization() != null ? user.getOrganization().getName() : null);
        dto.setDepartmentId(user.getDepartment() != null ? user.getDepartment().getId() : null);
        dto.setDepartmentName(user.getDepartment() != null ? user.getDepartment().getName() : null);
        dto.setActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setRoles(user.getUserRoles().stream()
                .map(userRole -> userRole.getRole().getRoleName().name())
                .toList());
        dto.setRole(user.getUserRoles().stream()
                .filter(userRole -> Boolean.TRUE.equals(userRole.getPrimaryRole()))
                .map(userRole -> userRole.getRole().getRoleName().name())
                .findFirst()
                .orElse(dto.getRoles().isEmpty() ? null : dto.getRoles().get(0)));
        return dto;
    }

    private void replacePrimaryRole(User user, RoleType roleType) {
        Role role = roleRepository.findByRoleName(roleType)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleType));
        userRoleRepository.deleteAll(user.getUserRoles());
        user.getUserRoles().clear();

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setPrimaryRole(true);
        userRoleRepository.save(userRole);
    }

    private Organization resolveOrganization(Long organizationId) {
        if (organizationId == null) {
            return null;
        }
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + organizationId));
    }

    private Department resolveDepartment(Long departmentId, Organization organization) {
        if (departmentId == null) {
            return null;
        }
        Department department = departmentRepository.findWithDetailsById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + departmentId));
        if (organization != null && !department.getOrganization().getId().equals(organization.getId())) {
            throw new IllegalArgumentException("Department does not belong to the selected organization");
        }
        return department;
    }

    private String firstNameFrom(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length == 0 ? fullName : parts[0];
    }

    private String lastNameFrom(String fullName) {
        String[] parts = fullName.trim().split("\\s+", 2);
        return parts.length < 2 ? "" : parts[1];
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}
