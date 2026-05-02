package com.wpms.controller;

import com.wpms.dto.ApiResponse;
import com.wpms.dto.ChangePasswordRequestDTO;
import com.wpms.dto.ForgotPasswordRequestDTO;
import com.wpms.dto.LoginRequest;
import com.wpms.dto.LoginResponse;
import com.wpms.dto.ProfileUpdateRequestDTO;
import com.wpms.dto.ResetPasswordRequestDTO;
import com.wpms.dto.UserResponseDTO;
import com.wpms.service.AuthService;
import com.wpms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PutMapping("/profile")
    public ApiResponse<UserResponseDTO> updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequestDTO request
    ) {
        return ApiResponse.success("Profile updated successfully", authService.updateProfile(authentication.getName(), request));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequestDTO request
    ) {
        return authService.changePassword(authentication.getName(), request);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/me")
    public UserResponseDTO me(Authentication authentication) {
        return userService.getCurrentUserProfile(authentication.getName());
    }
}
