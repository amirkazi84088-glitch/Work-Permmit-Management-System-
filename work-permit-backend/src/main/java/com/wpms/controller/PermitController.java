package com.wpms.controller;

import com.wpms.dto.PermitRequestDTO;
import com.wpms.dto.PermitResponseDTO;
import com.wpms.dto.InspectionRequestDTO;
import com.wpms.dto.InspectionResponseDTO;
import com.wpms.service.PermitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestPart;

import java.util.List;
import java.util.Map;
import com.wpms.entity.PermitStatus;

@RestController
@RequestMapping("/api/permits")
public class PermitController {

    private final PermitService permitService;

    public PermitController(PermitService permitService) {
        this.permitService = permitService;
    }

    @PostMapping
    public PermitResponseDTO createPermit(@Valid @RequestBody PermitRequestDTO request, Authentication authentication) {
        return permitService.createPermit(request, authentication.getName());
    }

    @GetMapping
    public List<PermitResponseDTO> getPermits(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PermitStatus status,
            @RequestParam(required = false) String permitType,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Long requestedById
    ) {
        return permitService.getPermits(authentication.getName(), search, status, permitType, organizationId, requestedById);
    }

    @GetMapping("/my")
    public List<PermitResponseDTO> getMyPermits(Authentication authentication) {
        return permitService.getMyPermits(authentication.getName());
    }

    @GetMapping("/{permitId}")
    public PermitResponseDTO getPermitById(@PathVariable Long permitId, Authentication authentication) {
        return permitService.getPermitById(permitId, authentication.getName());
    }

    @PutMapping("/{permitId}/submit")
    public PermitResponseDTO submitPermit(@PathVariable Long permitId, Authentication authentication) {
        return permitService.submitPermit(permitId, authentication.getName());
    }

    @PutMapping("/{permitId}/request-closure")
    public PermitResponseDTO requestClosure(@PathVariable Long permitId, Authentication authentication) {
        return permitService.requestClosure(permitId, authentication.getName());
    }

    @PutMapping("/{permitId}/close")
    @PreAuthorize("hasAnyRole('SUPERVISOR','ADMIN','SUPER_ADMIN')")
    public PermitResponseDTO closePermit(@PathVariable Long permitId, Authentication authentication) {
        return permitService.closePermit(permitId, authentication.getName());
    }

    @PutMapping("/{permitId}/cancel")
    public PermitResponseDTO cancelPermit(@PathVariable Long permitId, Authentication authentication) {
        return permitService.cancelPermit(permitId, authentication.getName());
    }

    @PutMapping("/{permitId}/extend")
    public PermitResponseDTO extendPermit(@PathVariable Long permitId, Authentication authentication) {
        return permitService.extendPermit(permitId, authentication.getName());
    }

    @PostMapping("/{permitId}/inspections")
    @PreAuthorize("hasAnyRole('SUPERVISOR','SAFETY_OFFICER','PERMIT_APPROVER','ADMIN','SUPER_ADMIN')")
    public com.wpms.dto.ApiResponse<InspectionResponseDTO> addInspection(
            @PathVariable Long permitId,
            @Valid @RequestBody InspectionRequestDTO request,
            Authentication authentication
    ) {
        return com.wpms.dto.ApiResponse.success(
                "Inspection added successfully",
                permitService.addInspection(permitId, request, authentication.getName())
        );
    }

    @PostMapping(value = "/{permitId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public com.wpms.dto.ApiResponse<Map<String, Object>> uploadAttachment(
            @PathVariable Long permitId,
            @RequestPart("file") MultipartFile file,
            Authentication authentication
    ) {
        return com.wpms.dto.ApiResponse.success(
                "Attachment uploaded successfully",
                permitService.uploadAttachment(permitId, file, authentication.getName())
        );
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportPermits(
            Authentication authentication,
            @RequestParam(defaultValue = "PDF") String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PermitStatus status,
            @RequestParam(required = false) String permitType,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) Long requestedById
    ) {
        byte[] content = permitService.exportPermits(authentication.getName(), format, search, status, permitType, organizationId, requestedById);
        String extension = "EXCEL".equalsIgnoreCase(format) ? "csv" : "csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=permits-export." + extension)
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(content);
    }
}
