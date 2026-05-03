package com.wpms.repository;

import com.wpms.entity.AuditLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findAllByOrderByLoggedAtDesc();

    @EntityGraph(attributePaths = {"user"})
    List<AuditLog> findByLoggedAtBetweenOrderByLoggedAtDesc(LocalDateTime start, LocalDateTime end);

    @Modifying
    @Query("delete from AuditLog a where a.user.id = :userId")
    void deleteByUserId(Long userId);
}
