package com.wpms.service;

import com.wpms.entity.Permit;
import com.wpms.entity.PermitStatus;
import com.wpms.repository.PermitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class PermitExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(PermitExpiryScheduler.class);

    private final PermitRepository permitRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public PermitExpiryScheduler(
            PermitRepository permitRepository,
            AuditLogService auditLogService,
            NotificationService notificationService
    ) {
        this.permitRepository = permitRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void expirePermits() {
        List<Permit> expiredPermits = permitRepository.findByStatusAndExpiryAtBefore(PermitStatus.ACTIVE, LocalDateTime.now());
        log.info("Permit expiry scheduler tick. Found {} expired active permits.", expiredPermits.size());

        for (Permit permit : expiredPermits) {
            permit.setStatus(PermitStatus.EXPIRED);
            permitRepository.save(permit);
            auditLogService.log(
                    permit.getRequester().getEmail(),
                    "PERMIT",
                    "Permit auto-expired",
                    permit.getId()
            );
            notificationService.notifyUser(
                    permit.getRequester().getId(),
                    "Permit expired",
                    "Permit " + permit.getPermitNumber() + " has expired."
            );
        }
    }
}
