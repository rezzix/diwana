package com.diwana.security;

import com.diwana.common.exception.ForbiddenException;
import com.diwana.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper {

    private final UserRepository userRepository;

    public AuthHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Long getCurrentUserId(UserDetails currentUser) {
        if (currentUser instanceof CustomUserDetails details) {
            return details.getUserId();
        }
        return Long.parseLong(currentUser.getUsername());
    }

    public Long getCurrentCompanyId(UserDetails currentUser) {
        if (currentUser instanceof CustomUserDetails details) {
            return details.getCompanyId();
        }
        return null;
    }

    public boolean isGlobalUser(UserDetails currentUser) {
        return getCurrentCompanyId(currentUser) == null;
    }

    public boolean hasAnyRole(UserDetails currentUser, String... roles) {
        for (String role : roles) {
            if (currentUser.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + role))) {
                return true;
            }
        }
        return false;
    }

    public void requireAdmin(UserDetails currentUser) {
        if (!hasAnyRole(currentUser, "ADMIN")) {
            throw new ForbiddenException("Admin access required");
        }
    }

    public void requireDeclarant(UserDetails currentUser) {
        if (!hasAnyRole(currentUser, "DECLARANT")) {
            throw new ForbiddenException("Declarant access required");
        }
    }

    public void requireController(UserDetails currentUser) {
        if (!hasAnyRole(currentUser, "CONTROLLER")) {
            throw new ForbiddenException("Controller access required");
        }
    }

    public void requireSelfOrAdmin(UserDetails currentUser, Long targetUserId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        Long userId = getCurrentUserId(currentUser);
        if (!userId.equals(targetUserId)) {
            throw new ForbiddenException("You can only access your own data");
        }
    }

    public void requireCompanyAccess(UserDetails currentUser, Long targetCompanyId) {
        if (hasAnyRole(currentUser, "ADMIN")) return;
        if (hasAnyRole(currentUser, "CONTROLLER")) return;
        Long userCompanyId = getCurrentCompanyId(currentUser);
        if (userCompanyId == null) return;
        if (!userCompanyId.equals(targetCompanyId)) {
            throw new ForbiddenException("You can only access your own company's data");
        }
    }
}
