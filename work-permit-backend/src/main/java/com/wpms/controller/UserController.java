package com.wpms.controller;

import com.wpms.dto.ApiResponse;
import com.wpms.dto.CreateUserRequestDTO;
import com.wpms.dto.UpdateUserRequestDTO;
import com.wpms.dto.UserResponseDTO;
import com.wpms.entity.RoleType;
import com.wpms.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserRequestDTO request) {
        return userService.createUser(request);
    }

    @GetMapping
    public List<UserResponseDTO> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponseDTO> getUser(@PathVariable Long userId) {
        return ApiResponse.success("User fetched successfully", userService.getUserById(userId));
    }

    @PutMapping("/{userId}")
    public ApiResponse<UserResponseDTO> updateUser(@PathVariable Long userId, @Valid @RequestBody UpdateUserRequestDTO request) {
        return ApiResponse.success("User updated successfully", userService.updateUser(userId, request));
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ApiResponse.success("User deleted successfully", null);
    }

    @PutMapping("/{userId}/toggle-status")
    public UserResponseDTO toggleUserStatus(@PathVariable Long userId) {
        return userService.toggleUserStatus(userId);
    }

    @PostMapping("/{userId}/reset-password")
    public ApiResponse<Void> resetPassword(@PathVariable Long userId) {
        userService.resetUserPassword(userId);
        return ApiResponse.success("User password reset successfully", null);
    }

    @GetMapping("/by-role")
    public ApiResponse<List<UserResponseDTO>> getUsersByRole(
            @RequestParam RoleType role,
            @RequestParam(required = false) Long organizationId
    ) {
        return ApiResponse.success("Users fetched successfully", userService.getUsersByRole(role, organizationId));
    }
}
