package com.wpms.repository;

import com.wpms.entity.Department;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    @EntityGraph(attributePaths = {"organization", "manager"})
    List<Department> findByOrganizationIdOrderByNameAsc(Long organizationId);

    @EntityGraph(attributePaths = {"organization", "manager"})
    Optional<Department> findWithDetailsById(Long id);

    @Modifying
    @Query("update Department d set d.manager = null where d.manager.id = :userId")
    void clearManagerByUserId(Long userId);
}
