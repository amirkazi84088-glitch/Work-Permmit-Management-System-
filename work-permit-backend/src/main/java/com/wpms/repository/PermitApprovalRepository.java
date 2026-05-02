package com.wpms.repository;

import com.wpms.entity.PermitApproval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitApprovalRepository extends JpaRepository<PermitApproval, Long> {

    List<PermitApproval> findByPermitId(Long permitId);
}
