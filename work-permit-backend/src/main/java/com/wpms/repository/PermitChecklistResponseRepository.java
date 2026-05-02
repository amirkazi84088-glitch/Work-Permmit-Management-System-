package com.wpms.repository;

import com.wpms.entity.PermitChecklistResponse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitChecklistResponseRepository extends JpaRepository<PermitChecklistResponse, Long> {

    List<PermitChecklistResponse> findByPermitId(Long permitId);
}
