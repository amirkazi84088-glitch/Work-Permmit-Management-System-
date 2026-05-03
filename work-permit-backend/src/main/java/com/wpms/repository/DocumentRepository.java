package com.wpms.repository;

import com.wpms.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByPermitId(Long permitId);

    @Modifying
    @Query("update Document d set d.uploadedBy = null where d.uploadedBy.id = :userId")
    void clearUploadedByUserId(Long userId);
}
