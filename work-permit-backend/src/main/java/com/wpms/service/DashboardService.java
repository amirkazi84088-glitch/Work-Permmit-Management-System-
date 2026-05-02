package com.wpms.service;

import com.wpms.entity.PermitStatus;
import com.wpms.entity.RoleType;
import com.wpms.entity.User;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.ApprovalRepository;
import com.wpms.repository.NotificationRepository;
import com.wpms.repository.PermitRepository;
import com.wpms.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final PermitRepository permitRepository;
    private final NotificationRepository notificationRepository;
    private final ApprovalRepository approvalRepository;

    public DashboardService(
            UserRepository userRepository,
            PermitRepository permitRepository,
            NotificationRepository notificationRepository,
            ApprovalRepository approvalRepository
    ) {
        this.userRepository = userRepository;
        this.permitRepository = permitRepository;
        this.notificationRepository = notificationRepository;
        this.approvalRepository = approvalRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStats(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoleType primaryRole = user.getUserRoles().stream()
                .map(userRole -> userRole.getRole().getRoleName())
                .findFirst()
                .orElse(RoleType.WORKER);

        Long organizationId = user.getOrganization() != null ? user.getOrganization().getId() : null;
        List<Map<String, Object>> cards = switch (primaryRole) {
            case WORKER -> List.of(
                    card("My Permits", permitRepository.countByRequesterId(user.getId())),
                    card("Draft Permits", permitRepository.countByRequesterIdAndStatus(user.getId(), PermitStatus.DRAFT)),
                    card("Active Permits", permitRepository.countByRequesterIdAndStatus(user.getId(), PermitStatus.ACTIVE)),
                    card("Unread Notifications", notificationRepository.countByUserIdAndReadStatusFalse(user.getId()))
            );
            case SUPERVISOR, SAFETY_OFFICER, PERMIT_APPROVER -> List.of(
                    card("Submitted Permits", permitRepository.countByStatus(PermitStatus.SUBMITTED)),
                    card("My Approvals", approvalRepository.countByApprovedById(user.getId())),
                    card("Active Permits", permitRepository.countByStatus(PermitStatus.ACTIVE)),
                    card("Unread Notifications", notificationRepository.countByUserIdAndReadStatusFalse(user.getId()))
            );
            case ADMIN, SUPER_ADMIN -> List.of(
                    card("Total Users", primaryRole == RoleType.ADMIN && organizationId != null
                            ? userRepository.countByOrganizationId(organizationId)
                            : userRepository.count()),
                    card("Active Users", primaryRole == RoleType.ADMIN && organizationId != null
                            ? userRepository.countByOrganizationIdAndIsActiveTrue(organizationId)
                            : userRepository.countByIsActiveTrue()),
                    card("Total Permits", primaryRole == RoleType.ADMIN && organizationId != null
                            ? permitRepository.countByRequesterOrganizationId(organizationId)
                            : permitRepository.count()),
                    card("Expired Permits", primaryRole == RoleType.ADMIN && organizationId != null
                            ? permitRepository.countByRequesterOrganizationIdAndStatus(organizationId, PermitStatus.EXPIRED)
                            : permitRepository.countByStatus(PermitStatus.EXPIRED))
            );
        };

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("role", primaryRole.name());
        result.put("cards", cards);
        return result;
    }

    private Map<String, Object> card(String title, long value) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("title", title);
        card.put("value", value);
        return card;
    }
}
