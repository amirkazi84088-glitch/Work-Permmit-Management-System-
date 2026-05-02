package com.wpms.service;

import com.wpms.dto.InspectionRequestDTO;
import com.wpms.dto.InspectionResponseDTO;
import com.wpms.dto.PermitResponseDTO;
import com.wpms.entity.Document;
import com.wpms.entity.PermitInspection;
import com.wpms.entity.Permit;
import com.wpms.entity.PermitChecklist;
import com.wpms.entity.RoleType;
import com.wpms.entity.PermitStatus;
import com.wpms.entity.PermitType;
import com.wpms.entity.User;
import com.wpms.exception.PermitStateException;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.DocumentRepository;
import com.wpms.repository.PermitInspectionRepository;
import com.wpms.repository.PermitChecklistRepository;
import com.wpms.repository.PermitRepository;
import com.wpms.repository.PermitTypeRepository;
import com.wpms.repository.UserRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class PermitService {

    private final PermitRepository permitRepository;
    private final PermitTypeRepository permitTypeRepository;
    private final PermitChecklistRepository permitChecklistRepository;
    private final PermitInspectionRepository permitInspectionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public PermitService(
            PermitRepository permitRepository,
            PermitTypeRepository permitTypeRepository,
            PermitChecklistRepository permitChecklistRepository,
            PermitInspectionRepository permitInspectionRepository,
            DocumentRepository documentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.permitRepository = permitRepository;
        this.permitTypeRepository = permitTypeRepository;
        this.permitChecklistRepository = permitChecklistRepository;
        this.permitInspectionRepository = permitInspectionRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public PermitResponseDTO createPermit(com.wpms.dto.PermitRequestDTO request, String userEmail) {
        User requester = getUserByEmail(userEmail);
        PermitType permitType = permitTypeRepository.findById(request.getPermitTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Permit type not found: " + request.getPermitTypeId()));

        Permit permit = new Permit();
        permit.setPermitNumber(generatePermitNumber());
        permit.setRequester(requester);
        permit.setPermitType(permitType);
        permit.setTitle(request.getTitle());
        permit.setDescription(request.getDescription());
        permit.setLocation(request.getLocation());
        permit.setStatus(PermitStatus.DRAFT);
        permit.setStartDate(parseDateTime(request.getStartDate()));
        permit.setExpiryAt(parseDateTime(request.getEndDate()));
        permit = permitRepository.save(permit);

        auditLogService.log(userEmail, "PERMIT", "Created permit", permit.getId());
        notificationService.notifyUser(requester.getId(), "Permit created", "Permit " + permit.getPermitNumber() + " was created in DRAFT status.");
        return mapToDto(permit);
    }

    @Transactional(readOnly = true)
    public List<PermitResponseDTO> getMyPermits(String userEmail) {
        User requester = getUserByEmail(userEmail);
        return permitRepository.findByRequesterId(requester.getId()).stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PermitResponseDTO> getPermits(
            String userEmail,
            String search,
            PermitStatus status,
            String permitType,
            Long organizationId,
            Long requestedById
    ) {
        User user = getUserByEmail(userEmail);
        List<Permit> permits;

        if (hasRole(user, RoleType.SUPER_ADMIN)) {
            permits = permitRepository.findAll();
        } else if (hasRole(user, RoleType.ADMIN)) {
            Long orgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
            permits = orgId == null ? permitRepository.findAll() : permitRepository.findByRequesterOrganizationId(orgId);
        } else if (hasAnyRole(user, RoleType.SUPERVISOR, RoleType.SAFETY_OFFICER, RoleType.PERMIT_APPROVER)) {
            permits = permitRepository.findAll();
        } else {
            permits = permitRepository.findByRequesterId(user.getId());
        }

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase();
        return permits.stream()
                .filter(permit -> status == null || permit.getStatus() == status)
                .filter(permit -> permitType == null || permitType.isBlank()
                        || permit.getPermitType().getName().equalsIgnoreCase(permitType))
                .filter(permit -> organizationId == null
                        || (permit.getRequester().getOrganization() != null
                        && permit.getRequester().getOrganization().getId().equals(organizationId)))
                .filter(permit -> requestedById == null || permit.getRequester().getId().equals(requestedById))
                .filter(permit -> normalizedSearch.isBlank() || matchesSearch(permit, normalizedSearch))
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PermitResponseDTO getPermitById(Long permitId, String userEmail) {
        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        validateAccess(permit, getUserByEmail(userEmail));
        return mapToDto(permit);
    }

    @Transactional(readOnly = true)
    public PermitResponseDTO getPermitById(Long permitId) {
        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        return mapToDto(permit);
    }

    @Transactional
    public PermitResponseDTO submitPermit(Long permitId, String userEmail) {
        Permit permit = getOwnedPermit(permitId, userEmail);
        if (permit.getStatus() != PermitStatus.DRAFT) {
            throw new PermitStateException("Only DRAFT permits can be submitted");
        }
        permit.setStatus(PermitStatus.PENDING_SUPERVISOR);
        permit.setSubmittedAt(LocalDateTime.now());
        permit = permitRepository.save(permit);
        auditLogService.log(userEmail, "PERMIT", "Submitted permit", permit.getId());
        notificationService.notifyUser(permit.getRequester().getId(), "Permit submitted", "Permit " + permit.getPermitNumber() + " was submitted for supervisor review.");
        return mapToDto(permit);
    }

    @Transactional
    public PermitResponseDTO requestClosure(Long permitId, String userEmail) {
        Permit permit = getOwnedPermit(permitId, userEmail);
        if (permit.getStatus() != PermitStatus.ACTIVE) {
            throw new PermitStateException("Only ACTIVE permits can request closure");
        }
        permit.setStatus(PermitStatus.CLOSURE_REQUESTED);
        permit = permitRepository.save(permit);
        auditLogService.log(userEmail, "PERMIT", "Requested permit closure", permit.getId());
        notificationService.notifyUser(permit.getRequester().getId(), "Closure requested", "Closure requested for permit " + permit.getPermitNumber() + ".");
        return mapToDto(permit);
    }

    @Transactional
    public PermitResponseDTO closePermit(Long permitId, String supervisorEmail) {
        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        if (permit.getStatus() != PermitStatus.CLOSURE_REQUESTED) {
            throw new PermitStateException("Only CLOSURE_REQUESTED permits can be closed");
        }
        permit.setStatus(PermitStatus.CLOSED);
        permit = permitRepository.save(permit);
        auditLogService.log(supervisorEmail, "PERMIT", "Closed permit", permit.getId());
        notificationService.notifyUser(permit.getRequester().getId(), "Permit closed", "Permit " + permit.getPermitNumber() + " was closed.");
        return mapToDto(permit);
    }

    @Transactional
    public PermitResponseDTO cancelPermit(Long permitId, String userEmail) {
        Permit permit = getOwnedPermit(permitId, userEmail);
        if (permit.getStatus() != PermitStatus.DRAFT && permit.getStatus() != PermitStatus.SUBMITTED) {
            throw new PermitStateException("Only DRAFT or SUBMITTED permits can be cancelled");
        }
        permit.setStatus(PermitStatus.CANCELLED);
        permit = permitRepository.save(permit);
        auditLogService.log(userEmail, "PERMIT", "Cancelled permit", permit.getId());
        notificationService.notifyUser(permit.getRequester().getId(), "Permit cancelled", "Permit " + permit.getPermitNumber() + " was cancelled.");
        return mapToDto(permit);
    }

    @Transactional
    public PermitResponseDTO extendPermit(Long permitId, String userEmail) {
        Permit permit = getOwnedPermit(permitId, userEmail);
        if (permit.getStatus() != PermitStatus.ACTIVE && permit.getStatus() != PermitStatus.CLOSURE_REQUESTED) {
            throw new PermitStateException("Only ACTIVE or CLOSURE_REQUESTED permits can be extended");
        }
        permit.setStatus(PermitStatus.SUBMITTED);
        permit.setExpiryAt(null);
        permit = permitRepository.save(permit);
        auditLogService.log(userEmail, "PERMIT", "Requested permit extension", permit.getId());
        notificationService.notifyUser(permit.getRequester().getId(), "Permit extension requested", "Permit " + permit.getPermitNumber() + " was re-submitted for extension approval.");
        return mapToDto(permit);
    }

    @Transactional
    public InspectionResponseDTO addInspection(Long permitId, InspectionRequestDTO request, String userEmail) {
        User user = getUserByEmail(userEmail);
        if (!hasAnyRole(user, RoleType.SAFETY_OFFICER, RoleType.SUPERVISOR, RoleType.ADMIN, RoleType.SUPER_ADMIN, RoleType.PERMIT_APPROVER)) {
            throw new ResourceNotFoundException("Permit not found: " + permitId);
        }

        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        validateAccess(permit, user);

        PermitInspection inspection = new PermitInspection();
        inspection.setPermit(permit);
        inspection.setInspectedBy(user);
        inspection.setInspectionDate(request.getInspectionDate() == null ? LocalDateTime.now() : request.getInspectionDate());
        inspection.setResult(request.getResult());
        inspection.setFindings(request.getFindings());
        inspection.setRecommendations(request.getRecommendations());
        inspection.setFollowUpRequired(Boolean.TRUE.equals(request.getFollowUpRequired()));
        inspection.setFollowUpDate(request.getFollowUpDate());
        inspection = permitInspectionRepository.save(inspection);

        auditLogService.log(userEmail, "INSPECTION", "Added inspection", inspection.getId());
        return mapInspectionToDto(inspection);
    }

    @Transactional
    public Map<String, Object> uploadAttachment(Long permitId, MultipartFile file, String userEmail) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        User user = getUserByEmail(userEmail);
        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        validateAccess(permit, user);

        try {
            String originalFileName = file.getOriginalFilename() == null ? "attachment" : Path.of(file.getOriginalFilename()).getFileName().toString();
            String storedName = UUID.randomUUID() + "-" + originalFileName.replaceAll("[^A-Za-z0-9._-]", "_");
            Path uploadDir = Path.of("uploads", "permits", permitId.toString());
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            Document document = new Document();
            document.setPermit(permit);
            document.setUploadedBy(user);
            document.setFileName(originalFileName);
            document.setFilePath(target.toString());
            document = documentRepository.save(document);

            auditLogService.log(userEmail, "DOCUMENT", "Uploaded attachment", document.getId());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("id", document.getId());
            response.put("fileName", document.getFileName());
            response.put("fileUrl", document.getFilePath().replace('\\', '/'));
            response.put("fileType", file.getContentType());
            response.put("fileSize", file.getSize());
            response.put("uploadedAt", document.getUploadedAt());
            response.put("uploadedBy", user.getName());
            return response;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to store file");
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportPermits(
            String userEmail,
            String format,
            String search,
            PermitStatus status,
            String permitType,
            Long organizationId,
            Long requestedById
    ) {
        List<PermitResponseDTO> permits = getPermits(userEmail, search, status, permitType, organizationId, requestedById);
        StringBuilder csv = new StringBuilder("permitNumber,title,requester,permitType,status,submittedAt,expiryAt\n");
        for (PermitResponseDTO permit : permits) {
            csv.append(safe(permit.getPermitNumber())).append(',')
                    .append(safe(permit.getTitle())).append(',')
                    .append(safe(permit.getRequesterName())).append(',')
                    .append(safe(permit.getPermitTypeName())).append(',')
                    .append(permit.getStatus()).append(',')
                    .append(permit.getSubmittedAt() == null ? "" : permit.getSubmittedAt()).append(',')
                    .append(permit.getExpiryAt() == null ? "" : permit.getExpiryAt()).append('\n');
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public String generatePermitNumber() {
        int year = LocalDate.now().getYear();
        long sequence = permitRepository.count() + 1;
        String permitNumber = formatPermitNumber(year, sequence);
        while (permitRepository.findByPermitNumber(permitNumber).isPresent()) {
            sequence++;
            permitNumber = formatPermitNumber(year, sequence);
        }
        return permitNumber;
    }

    private String formatPermitNumber(int year, long sequence) {
        return String.format("WP-%d-%04d", year, sequence);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Permit getOwnedPermit(Long permitId, String userEmail) {
        Permit permit = permitRepository.findWithDetailsById(permitId)
                .orElseThrow(() -> new ResourceNotFoundException("Permit not found: " + permitId));
        User user = getUserByEmail(userEmail);
        validateOwnership(permit, user);
        return permit;
    }

    private void validateOwnership(Permit permit, User user) {
        if (!permit.getRequester().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Permit not found: " + permit.getId());
        }
    }

    private void validateAccess(Permit permit, User user) {
        if (permit.getRequester().getId().equals(user.getId())) {
            return;
        }
        if (hasAnyRole(user, RoleType.SUPERVISOR, RoleType.SAFETY_OFFICER, RoleType.PERMIT_APPROVER, RoleType.SUPER_ADMIN)) {
            return;
        }
        if (hasRole(user, RoleType.ADMIN)) {
            Long permitOrgId = permit.getRequester().getOrganization() != null ? permit.getRequester().getOrganization().getId() : null;
            Long userOrgId = user.getOrganization() != null ? user.getOrganization().getId() : null;
            if (permitOrgId != null && permitOrgId.equals(userOrgId)) {
                return;
            }
        }
        throw new ResourceNotFoundException("Permit not found: " + permit.getId());
    }

    private boolean hasRole(User user, RoleType roleType) {
        return user.getUserRoles().stream().anyMatch(userRole -> userRole.getRole().getRoleName() == roleType);
    }

    private boolean hasAnyRole(User user, RoleType... roleTypes) {
        Set<RoleType> allowed = java.util.EnumSet.noneOf(RoleType.class);
        allowed.addAll(List.of(roleTypes));
        return user.getUserRoles().stream().anyMatch(userRole -> allowed.contains(userRole.getRole().getRoleName()));
    }

    private boolean matchesSearch(Permit permit, String search) {
        return contains(permit.getPermitNumber(), search)
                || contains(permit.getTitle(), search)
                || contains(permit.getDescription(), search)
                || contains(permit.getRequester().getName(), search)
                || contains(permit.getPermitType().getName(), search);
    }

    private boolean contains(String value, String search) {
        return value != null && value.toLowerCase().contains(search);
    }

    private InspectionResponseDTO mapInspectionToDto(PermitInspection inspection) {
        InspectionResponseDTO dto = new InspectionResponseDTO();
        dto.setId(inspection.getId());
        dto.setPermitId(inspection.getPermit().getId());
        dto.setPermitNumber(inspection.getPermit().getPermitNumber());
        dto.setInspectedById(inspection.getInspectedBy().getId());
        dto.setInspectedByName(inspection.getInspectedBy().getName());
        dto.setInspectionDate(inspection.getInspectionDate());
        dto.setResult(inspection.getResult());
        dto.setFindings(inspection.getFindings());
        dto.setRecommendations(inspection.getRecommendations());
        dto.setFollowUpRequired(inspection.getFollowUpRequired());
        dto.setFollowUpDate(inspection.getFollowUpDate());
        return dto;
    }

    private String safe(String value) {
        return value == null ? "" : value.replace(',', ';');
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDateTime.parse(value.trim());
    }

    private PermitResponseDTO mapToDto(Permit permit) {
        PermitResponseDTO dto = new PermitResponseDTO();
        dto.setId(permit.getId());
        dto.setPermitNumber(permit.getPermitNumber());
        dto.setRequesterId(permit.getRequester().getId());
        dto.setRequesterName(permit.getRequester().getName());
        dto.setPermitTypeId(permit.getPermitType().getId());
        dto.setPermitTypeName(permit.getPermitType().getName());
        dto.setTitle(permit.getTitle());
        dto.setDescription(permit.getDescription());
        dto.setLocation(permit.getLocation());
        dto.setStatus(permit.getStatus());
        dto.setStartDate(permit.getStartDate());
        dto.setSubmittedAt(permit.getSubmittedAt());
        dto.setExpiryAt(permit.getExpiryAt());
        return dto;
    }
}
