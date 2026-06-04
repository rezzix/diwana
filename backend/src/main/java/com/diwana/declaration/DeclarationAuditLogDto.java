package com.diwana.declaration;

import java.time.Instant;

public record DeclarationAuditLogDto(
        Long id,
        String action,
        String fromStatus,
        String toStatus,
        String note,
        String userName,
        Instant createdAt
) {}