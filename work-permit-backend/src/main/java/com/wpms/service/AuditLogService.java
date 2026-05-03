package com.wpms.service;

import com.wpms.dto.AuditLogResponseDTO;
import com.wpms.entity.AuditLog;
import com.wpms.entity.User;
import com.wpms.repository.AuditLogRepository;
import com.wpms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void log(String userEmail, String module, String action, Long entityId) {
        AuditLog auditLog = new AuditLog();
        auditLog.setModule(module);
        auditLog.setAction(action);
        auditLog.setEntityId(entityId);

        if (userEmail != null && !userEmail.isBlank()) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            auditLog.setUser(user);
        }

        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void deleteLogsForUser(Long userId) {
        auditLogRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponseDTO> getAuditLogs(LocalDate startDate, LocalDate endDate) {
        List<AuditLog> logs;
        if (startDate != null && endDate != null) {
            logs = auditLogRepository.findByLoggedAtBetweenOrderByLoggedAtDesc(
                    startDate.atStartOfDay(),
                    endDate.plusDays(1).atStartOfDay()
            );
        } else {
            logs = auditLogRepository.findAllByOrderByLoggedAtDesc();
        }
        return logs.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public String exportAuditLogsCsv(LocalDate startDate, LocalDate endDate) {
        StringBuilder csv = new StringBuilder("id,userEmail,module,action,entityId,loggedAt\n");
        for (AuditLogResponseDTO log : getAuditLogs(startDate, endDate)) {
            csv.append(log.getId()).append(',')
                    .append(safe(log.getUserEmail())).append(',')
                    .append(safe(log.getModule())).append(',')
                    .append(safe(log.getAction())).append(',')
                    .append(log.getEntityId() == null ? "" : log.getEntityId()).append(',')
                    .append(log.getLoggedAt()).append('\n');
        }
        return csv.toString();
    }

    private AuditLogResponseDTO toDto(AuditLog auditLog) {
        AuditLogResponseDTO dto = new AuditLogResponseDTO();
        dto.setId(auditLog.getId());
        dto.setUserEmail(auditLog.getUser() != null ? auditLog.getUser().getEmail() : null);
        dto.setModule(auditLog.getModule());
        dto.setAction(auditLog.getAction());
        dto.setEntityId(auditLog.getEntityId());
        dto.setLoggedAt(auditLog.getLoggedAt());
        return dto;
    }

    private String safe(String value) {
        return value == null ? "" : value.replace(',', ';');
    }
}
