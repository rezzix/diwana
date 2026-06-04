package com.diwana.dashboard;

import com.diwana.common.dto.ApiResponse;
import com.diwana.declaration.Declaration;
import com.diwana.declaration.DeclarationRepository;
import com.diwana.customsoffice.CustomsOfficeRepository;
import com.diwana.security.AuthHelper;
import com.diwana.user.User;
import com.diwana.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AuthHelper authHelper;
    private final DeclarationRepository declarationRepository;
    private final UserRepository userRepository;
    private final CustomsOfficeRepository customsOfficeRepository;

    public DashboardController(AuthHelper authHelper, DeclarationRepository declarationRepository,
                                UserRepository userRepository, CustomsOfficeRepository customsOfficeRepository) {
        this.authHelper = authHelper;
        this.declarationRepository = declarationRepository;
        this.userRepository = userRepository;
        this.customsOfficeRepository = customsOfficeRepository;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardStats>> getStats(@AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        Long customsOfficeId = authHelper.getCurrentCustomsOfficeId(currentUser);
        String role = currentUser.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .findFirst()
                .map(a -> a.getAuthority().substring(5))
                .orElse("UNKNOWN");

        DashboardStats stats = new DashboardStats(role);

        switch (User.Role.valueOf(role)) {
            case ADMIN -> {
                List<User> allUsers = userRepository.findAll();
                long activeCount = allUsers.stream().filter(User::isActive).count();
                long inactiveCount = allUsers.size() - activeCount;
                Map<String, Long> byRole = allUsers.stream()
                        .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));
                stats.setAdminStats(new DashboardStats.AdminStats(allUsers.size(), activeCount, inactiveCount, byRole));
            }
            case DECLARANT -> {
                List<Declaration> declarations = declarationRepository.findByDeclarantIdOrderByCreatedAtDesc(userId);
                Map<String, Long> byStatus = declarations.stream()
                        .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting()));
                stats.setDeclarantStats(new DashboardStats.DeclarantStats(declarations.size(), byStatus));
            }
            case CONTROLLER -> {
                List<Declaration.Status> pendingStatuses = List.of(
                        Declaration.Status.SUBMITTED, Declaration.Status.UNDER_REVIEW, Declaration.Status.INFO_REQUESTED);
                List<Declaration> pending;
                if (customsOfficeId != null) {
                    var office = customsOfficeRepository.findById(customsOfficeId).orElse(null);
                    if (office != null) {
                        pending = declarationRepository.findByStatusInAndCustomsOfficeOrderByCreatedAtAsc(pendingStatuses, office.getName());
                    } else {
                        pending = declarationRepository.findByStatusInOrderByCreatedAtAsc(pendingStatuses);
                    }
                } else {
                    pending = declarationRepository.findByStatusInOrderByCreatedAtAsc(pendingStatuses);
                }
                Map<String, Long> byStatus = pending.stream()
                        .collect(Collectors.groupingBy(d -> d.getStatus().name(), Collectors.counting()));
                String officeName = customsOfficeId != null
                        ? customsOfficeRepository.findById(customsOfficeId).map(o -> o.getName()).orElse(null)
                        : null;
                stats.setControllerStats(new DashboardStats.ControllerStats(pending.size(), byStatus, officeName));
            }
        }

        return ResponseEntity.ok(ApiResponse.of(stats));
    }
}