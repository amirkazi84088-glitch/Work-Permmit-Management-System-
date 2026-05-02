package com.wpms.repository;

import com.wpms.entity.AuditLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findAllByOrderByLoggedAtDesc();

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findByLoggedAtBetweenOrderByLoggedAtDesc(LocalDateTime start, LocalDateTime end);
}
