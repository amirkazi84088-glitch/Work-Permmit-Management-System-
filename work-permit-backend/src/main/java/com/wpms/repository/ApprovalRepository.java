package com.wpms.repository;

import com.wpms.entity.PermitApproval;
import com.wpms.entity.RoleType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApprovalRepository extends JpaRepository<PermitApproval, Long> {

    @EntityGraph(attributePaths = {"permit", "approvedBy"})
    List<PermitApproval> findByPermitIdOrderByApprovalLevelAsc(Long permitId);

    boolean existsByPermitIdAndApproverRole(Long permitId, RoleType approverRole);

    Optional<PermitApproval> findByPermitIdAndApproverRole(Long permitId, RoleType approverRole);

    long countByApprovedById(Long approvedById);
}
