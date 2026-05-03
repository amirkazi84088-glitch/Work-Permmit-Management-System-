package com.wpms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LoginRequest {

    @Email
    @NotBlank
    @Pattern(regexp = "^\\S+$", message = "Email must not contain spaces")
    private String email;

    @NotBlank
    @Pattern(regexp = "^\\S+$", message = "Password must not contain spaces")
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim();
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
