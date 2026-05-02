package com.wpms.repository;

import com.wpms.entity.Department;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    @EntityGraph(attributePaths = {"organization", "manager"})
    List<Department> findByOrganizationIdOrderByNameAsc(Long organizationId);

    @EntityGraph(attributePaths = {"organization", "manager"})
    Optional<Department> findWithDetailsById(Long id);
}
