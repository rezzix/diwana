package com.diwana.user;

public record UserDto(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String role,
        boolean active,
        Long companyId,
        String companyName
) {}
