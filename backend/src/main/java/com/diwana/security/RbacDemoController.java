package com.diwana.security;

import com.diwana.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class RbacDemoController {

    private final AuthHelper authHelper;

    public RbacDemoController(AuthHelper authHelper) {
        this.authHelper = authHelper;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> adminOnly() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("message", "Admin access granted")));
    }

    @GetMapping("/declarant")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<Map<String, String>>> declarantOnly() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("message", "Declarant access granted")));
    }

    @GetMapping("/controller")
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<Map<String, String>>> controllerOnly() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("message", "Controller access granted")));
    }

    @GetMapping("/any-authenticated")
    public ResponseEntity<ApiResponse<Map<String, String>>> anyAuthenticated(@AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "message", "Authenticated access granted",
                "user", currentUser.getUsername(),
                "roles", currentUser.getAuthorities().toString()
        )));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkAccess(@AuthenticationPrincipal UserDetails currentUser) {
        Map<String, Object> result = Map.of(
                "isAdmin", authHelper.hasAnyRole(currentUser, "ADMIN"),
                "isDeclarant", authHelper.hasAnyRole(currentUser, "DECLARANT"),
                "isController", authHelper.hasAnyRole(currentUser, "CONTROLLER"),
                "companyId", authHelper.getCurrentCompanyId(currentUser),
                "isGlobal", authHelper.isGlobalUser(currentUser)
        );
        return ResponseEntity.ok(ApiResponse.of(result));
    }
}
