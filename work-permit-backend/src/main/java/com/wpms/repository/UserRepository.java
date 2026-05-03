package com.wpms.repository;

import com.wpms.entity.User;
import com.wpms.entity.RoleType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    Optional<User> findWithRolesById(Long id);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    List<User> findAll();

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    List<User> findByIsActiveTrue();

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    Optional<User> findByResetToken(String resetToken);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    List<User> findDistinctByUserRolesRoleRoleName(RoleType roleName);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role", "organization", "department"})
    List<User> findDistinctByUserRolesRoleRoleNameAndOrganizationId(RoleType roleName, Long organizationId);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    long countByIsActiveTrue();

    long countByOrganizationId(Long organizationId);

    long countByOrganizationIdAndIsActiveTrue(Long organizationId);
}
