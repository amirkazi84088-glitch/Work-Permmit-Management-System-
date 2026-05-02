package com.wpms.repository;

import com.wpms.entity.PermitType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermitTypeRepository extends JpaRepository<PermitType, Long> {

    Optional<PermitType> findByName(String name);
}
