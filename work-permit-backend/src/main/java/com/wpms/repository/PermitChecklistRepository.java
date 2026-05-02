package com.wpms.repository;

import com.wpms.entity.PermitChecklist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitChecklistRepository extends JpaRepository<PermitChecklist, Long> {

    List<PermitChecklist> findByPermitTypeId(Long permitTypeId);
}
