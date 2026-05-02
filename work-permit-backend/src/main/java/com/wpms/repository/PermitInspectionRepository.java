package com.wpms.repository;

import com.wpms.entity.PermitInspection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitInspectionRepository extends JpaRepository<PermitInspection, Long> {

    @EntityGraph(attributePaths = {"permit", "inspectedBy"})
    List<PermitInspection> findByPermitIdOrderByInspectionDateDesc(Long permitId);
}
