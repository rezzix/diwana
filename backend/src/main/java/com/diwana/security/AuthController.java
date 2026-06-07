package com.diwana.security;

import com.diwana.common.dto.ApiResponse;
import com.diwana.common.exception.BadRequestException;
import com.diwana.user.User;
import com.diwana.user.UserDto;
import com.diwana.user.UserMapper;
import com.diwana.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final CustomUserDetailsService userDetailsService;
    private final String mode;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, UserMapper userMapper,
                          CustomUserDetailsService userDetailsService,
                          @Value("${diwana.mode:prod}") String mode) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.userDetailsService = userDetailsService;
        this.mode = mode;
    }

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserDto>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        boolean relaxedAuth = "dev".equals(mode);

        Authentication authentication;

        if (relaxedAuth) {
            // Dev mode: bypass password check — authenticate by username only
            CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(request.username());
            authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, userDetails.getPassword(), userDetails.getAuthorities());
        } else {
            // Demo and production: validate credentials normally
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Long userId;
        if (userDetails instanceof CustomUserDetails details) {
            userId = details.getUserId();
        } else {
            userId = Long.parseLong(userDetails.getUsername());
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(user)));
    }

    @GetMapping("/dev-users")
    public ResponseEntity<ApiResponse<List<DevUserDto>>> devUsers() {
        if (!"dev".equals(mode) && !"demo".equals(mode)) {
            return ResponseEntity.ok(ApiResponse.of(List.of()));
        }
        List<DevUserDto> users = userRepository.findAll().stream()
                .map(u -> new DevUserDto(u.getUsername(), u.getFirstName() + " " + u.getLastName(), u.getRole().name(),
                        u.getCompany() != null ? u.getCompany().getName() : null,
                        u.getCustomsOffice() != null ? u.getCustomsOffice().getName() : null))
                .toList();
        return ResponseEntity.ok(ApiResponse.of(users));
    }

    public record DevUserDto(String username, String displayName, String role, String company, String customsOffice) {}

    public record AuthConfig(boolean relaxedAuth, String mode) {}

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<AuthConfig>> config() {
        boolean relaxedAuth = "dev".equals(mode);
        return ResponseEntity.ok(ApiResponse.of(new AuthConfig(relaxedAuth, mode)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest httpRequest) {
        SecurityContextHolder.clearContext();
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok(ApiResponse.of("Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(@AuthenticationPrincipal UserDetails currentUser) {
        Long userId;
        if (currentUser instanceof CustomUserDetails details) {
            userId = details.getUserId();
        } else {
            userId = Long.parseLong(currentUser.getUsername());
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return ResponseEntity.ok(ApiResponse.of(userMapper.toDto(user)));
    }
}
