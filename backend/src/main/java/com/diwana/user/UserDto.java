package com.diwana.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean active,
        Long companyId,
        String companyName,
        Long customsOfficeId,
        String customsOfficeName
) {

    public record CreateUserRequest(
            @NotBlank @Size(min = 3, max = 100) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6) String password,
            @NotBlank @Size(min = 1, max = 100) String firstName,
            @NotBlank @Size(min = 1, max = 100) String lastName,
            @NotBlank String role,
            Long companyId,
            Long customsOfficeId
    ) {}
}