package com.diwana.security;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {

    private final Long userId;
    private final Long companyId;

    public CustomUserDetails(Long userId, String username, String password,
                             Collection<? extends SimpleGrantedAuthority> authorities,
                             Long companyId) {
        super(username, password, authorities);
        this.userId = userId;
        this.companyId = companyId;
    }

    public Long getUserId() { return userId; }
    public Long getCompanyId() { return companyId; }
    public boolean isGlobal() { return companyId == null; }
}
