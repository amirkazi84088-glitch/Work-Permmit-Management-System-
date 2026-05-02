package com.wpms.service;

import com.wpms.dto.ApiResponse;
import com.wpms.dto.ChangePasswordRequestDTO;
import com.wpms.dto.ForgotPasswordRequestDTO;
import com.wpms.dto.LoginRequest;
import com.wpms.dto.LoginResponse;
import com.wpms.dto.ProfileUpdateRequestDTO;
import com.wpms.dto.ResetPasswordRequestDTO;
import com.wpms.dto.UserResponseDTO;
import com.wpms.entity.User;
import com.wpms.exception.ResourceNotFoundException;
import com.wpms.repository.UserRepository;
import com.wpms.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BadCredentialsException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .authorities(user.getUserRoles().stream()
                        .map(userRole -> "ROLE_" + userRole.getRole().getRoleName().name())
                        .toArray(String[]::new))
                .build();

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new LoginResponse(jwtUtil.generateToken(userDetails));
    }

    public UserResponseDTO updateProfile(String currentEmail, ProfileUpdateRequestDTO request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentEmail));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setName((request.getFirstName() + " " + request.getLastName()).trim());
        user.setEmail(request.getEmail().trim());
        user.setPhone(request.getPhone());
        user = userRepository.save(user);

        auditLogService.log(user.getEmail(), "AUTH", "Updated profile", user.getId());
        return toUserResponse(userRepository.findWithRolesById(user.getId()).orElseThrow());
    }

    public ApiResponse<Void> changePassword(String currentEmail, ChangePasswordRequestDTO request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentEmail));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "AUTH", "Changed password", user.getId());
        return ApiResponse.success("Password updated successfully", null);
    }

    public ApiResponse<Void> forgotPassword(ForgotPasswordRequestDTO request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetToken(token);
            user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);
            notificationService.sendEmail(
                    user.getEmail(),
                    "WPMS password reset",
                    "Use this token to reset your password: " + token
            );
            auditLogService.log(user.getEmail(), "AUTH", "Requested password reset", user.getId());
        });

        return ApiResponse.success("If the email exists, reset instructions have been sent", null);
    }

    public ApiResponse<Void> resetPassword(ResetPasswordRequestDTO request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid reset token"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
        auditLogService.log(user.getEmail(), "AUTH", "Reset password", user.getId());
        return ApiResponse.success("Password reset successfully", null);
    }

    private UserResponseDTO toUserResponse(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setOrganizationId(user.getOrganization() != null ? user.getOrganization().getId() : null);
        dto.setOrganizationName(user.getOrganization() != null ? user.getOrganization().getName() : null);
        dto.setDepartmentId(user.getDepartment() != null ? user.getDepartment().getId() : null);
        dto.setDepartmentName(user.getDepartment() != null ? user.getDepartment().getName() : null);
        dto.setActive(user.getIsActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setRoles(user.getUserRoles().stream().map(userRole -> userRole.getRole().getRoleName().name()).toList());
        dto.setRole(user.getUserRoles().stream()
                .filter(userRole -> Boolean.TRUE.equals(userRole.getPrimaryRole()))
                .map(userRole -> userRole.getRole().getRoleName().name())
                .findFirst()
                .orElse(dto.getRoles().isEmpty() ? null : dto.getRoles().get(0)));
        return dto;
    }
}

