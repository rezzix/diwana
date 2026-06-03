package com.diwana.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable())
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login", "/api/auth/logout").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable())
            .httpBasic(httpBasic -> httpBasic.disable())
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));

        return http.build();
    }
}
