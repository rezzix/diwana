package com.diwana.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {

    private final Long userId;
    private final Long companyId;
    private final Long customsOfficeId;

    public CustomUserDetails(Long userId, String username, String password,
                             Collection<? extends SimpleGrantedAuthority> authorities,
                             Long companyId, Long customsOfficeId) {
        super(username, password, authorities);
        this.userId = userId;
        this.companyId = companyId;
        this.customsOfficeId = customsOfficeId;
    }

    public Long getUserId() { return userId; }
    public Long getCompanyId() { return companyId; }
    public Long getCustomsOfficeId() { return customsOfficeId; }
    public boolean isGlobal() { return companyId == null; }
}