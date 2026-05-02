package com.wpms.service;

import com.wpms.dto.PermitResponseDTO;
import com.wpms.entity.PermitStatus;
import com.wpms.entity.Role;
import com.wpms.entity.RoleType;
import com.wpms.entity.User;
import com.wpms.entity.UserRole;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.ApprovalRepository;
import com.wpms.repository.PermitRepository;
import com.wpms.repository.RoleRepository;
import com.wpms.repository.UserRepository;
import com.wpms.repository.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Service
public class ApprovalService {

    private static final List<RoleType> APPROVAL_CHAIN = List.of(
            RoleType.SUPERVISOR,
            RoleType.SAFETY_OFFICER
    );

    private final ApprovalRepository approvalRepository;
    private final PermitRepository permitRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final PermitService permitService;

    public ApprovalService(
            ApprovalRepository approvalRepository,
            PermitRepository permitRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository,
            NotificationService notificationService,
            AuditLogService auditLogService,
            PermitService permitService
    ) {
        this.approvalRepository = approvalRepository;
        this.permitRepository = permitRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.permitService = permitService;
    }

    @Transactional(readOnly = true)
    public List<PermitResponseDTO> getQueue(String userEmail) {
        User approver = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        RoleType primaryRole = getPrimaryRole(approver);
        if (!APPROVAL_CHAIN.contains(primaryRole)) {
            throw new ResourceNotFoundException("Approval queue not available for user");
        }

        PermitStatus queueStatus = statusForRole(primaryRole);
        return permitRepository.findByStatus(queueStatus).stream()
                .map(permit -> permitService.getPermitById(permit.getId(), userEmail))
                .toList();
    }

    @Transactional
    public PermitResponseDTO decide(Long permitId, String approverEmail, com.wpms.dto.ApprovalDecisionDTO decisionRequest) {
        var permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));

        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverEmail));
        RoleType stageRole = getPrimaryRole(approver);
        if (!APPROVAL_CHAIN.contains(stageRole)) {
            throw new com.wpms.exception.PermitStateException("User does not have an approval role");
        }

        PermitStatus expectedStatus = statusForRole(stageRole);
        if (permit.getStatus() != expectedStatus) {
            throw new com.wpms.exception.PermitStateException("This permit is waiting for " + expectedStatus.name());
        }

        int requiredLevel = APPROVAL_CHAIN.indexOf(stageRole) + 1;
        int completedLevels = approvalRepository.findByPermitIdOrderByApprovalLevelAsc(permitId).size();

        if (approvalRepository.existsByPermitIdAndApproverRole(permitId, stageRole)) {
            throw new com.wpms.exception.PermitStateException("This approval stage is already completed");
        }
        if (requiredLevel != completedLevels + 1) {
            throw new com.wpms.exception.PermitStateException("This permit is waiting for " + APPROVAL_CHAIN.get(completedLevels).name());
        }

        var approval = new com.wpms.entity.PermitApproval();
        approval.setPermit(permit);
        approval.setApprovedBy(approver);
        approval.setApproverRole(stageRole);
        approval.setApprovalLevel(requiredLevel);
        approval.setComments(decisionRequest.getComments());

        if (Boolean.TRUE.equals(decisionRequest.getApproved())) {
            approval.setDecision(PermitStatus.APPROVED);
            approvalRepository.save(approval);
            auditLogService.log(approverEmail, "APPROVAL", "Approved permit at level " + requiredLevel, permit.getId());

            if (requiredLevel == APPROVAL_CHAIN.size()) {
                permit.setStatus(PermitStatus.ACTIVE);
                if (permit.getExpiryAt() == null) {
                    permit.setExpiryAt(java.time.LocalDateTime.now().plusDays(30));
                }
                permitRepository.save(permit);
                notificationService.notifyUser(permit.getRequester().getId(), "Permit approved", "Permit " + permit.getPermitNumber() + " was approved and is now ACTIVE.");
                auditLogService.log(approverEmail, "PERMIT", "Permit activated", permit.getId());
            } else {
                RoleType nextRole = APPROVAL_CHAIN.get(requiredLevel);
                permit.setStatus(statusForRole(nextRole));
                permitRepository.save(permit);
                notifyNextApprovers(nextRole, "Permit " + permit.getPermitNumber() + " is awaiting your approval.");
                notificationService.notifyUser(
                        permit.getRequester().getId(),
                        "Permit moved to next stage",
                        "Permit " + permit.getPermitNumber() + " was approved by supervisor and sent to the safety officer."
                );
            }
        } else {
            approval.setDecision(PermitStatus.REJECTED);
            approvalRepository.save(approval);
            permit.setStatus(PermitStatus.REJECTED);
            permit.setExpiryAt(null);
            permitRepository.save(permit);
            notificationService.notifyUser(
                    permit.getRequester().getId(),
                    "Permit rejected",
                    "Permit " + permit.getPermitNumber() + " was rejected by " + stageRole.name() + " and returned to you for correction."
            );
            auditLogService.log(approverEmail, "APPROVAL", "Rejected permit at level " + requiredLevel, permit.getId());
        }

        return permitService.getPermitById(permitId);
    }

    private PermitStatus statusForRole(RoleType roleType) {
        return switch (roleType) {
            case SUPERVISOR -> PermitStatus.PENDING_SUPERVISOR;
            case SAFETY_OFFICER -> PermitStatus.PENDING_SAFETY_OFFICER;
            default -> PermitStatus.SUBMITTED;
        };
    }

    private RoleType getPrimaryRole(User user) {
        return user.getUserRoles().stream()
                .filter(userRole -> Boolean.TRUE.equals(userRole.getPrimaryRole()))
                .map(userRole -> userRole.getRole().getRoleName())
                .findFirst()
                .orElseGet(() -> user.getUserRoles().stream()
                        .map(userRole -> userRole.getRole().getRoleName())
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("User has no roles assigned")));
    }

    private void notifyNextApprovers(RoleType nextRole, String message) {
        Role role = roleRepository.findByRoleName(nextRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + nextRole));
        List<UserRole> userRoles = userRoleRepository.findByRoleId(role.getId());
        for (UserRole userRole : userRoles) {
            notificationService.notifyUser(userRole.getUser().getId(), "Permit approval pending", message);
        }
    }
}
