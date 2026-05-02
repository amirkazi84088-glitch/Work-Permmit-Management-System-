package com.wpms.repository;

import com.wpms.entity.Permit;
import com.wpms.entity.PermitStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PermitRepository extends JpaRepository<Permit, Long> {

    @EntityGraph(attributePaths = {"requester", "permitType"})
    Optional<Permit> findByPermitNumber(String permitNumber);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findByRequesterId(Long requesterId);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findByStatus(PermitStatus status);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    Optional<Permit> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findAll();

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findByRequesterOrganizationId(Long organizationId);

    long countByStatus(PermitStatus status);

    long countByRequesterId(Long requesterId);

    long countByRequesterIdAndStatus(Long requesterId, PermitStatus status);

    long countByRequesterOrganizationId(Long organizationId);

    long countByRequesterOrganizationIdAndStatus(Long organizationId, PermitStatus status);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findByStatusAndExpiryAtBefore(PermitStatus status, LocalDateTime expiryAt);

    @EntityGraph(attributePaths = {"requester", "permitType"})
    List<Permit> findBySubmittedAtBetweenOrderBySubmittedAtAsc(LocalDateTime start, LocalDateTime end);
}
