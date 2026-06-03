package com.diwana.user;

import com.diwana.common.exception.BadRequestException;
import com.diwana.common.exception.DuplicateKeyException;
import com.diwana.common.exception.EntityNotFoundException;
import com.diwana.company.Company;
import com.diwana.company.CompanyRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       CompanyRepository companyRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public User create(UserDto.CreateUserRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateKeyException("Username already exists: " + request.username());
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateKeyException("Email already exists: " + request.email());
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.role());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.role() + ". Allowed: ADMIN, DECLARANT, CONTROLLER");
        }

        if (role == User.Role.ADMIN) {
            throw new BadRequestException("Cannot create admin users via this endpoint");
        }

        // DECLARANT must have a company, CONTROLLER must not
        if (role == User.Role.DECLARANT && request.companyId() == null) {
            throw new BadRequestException("Declarant users must be assigned to a company");
        }
        if (role == User.Role.CONTROLLER && request.companyId() != null) {
            throw new BadRequestException("Controller users cannot be assigned to a company");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(role);

        if (request.companyId() != null) {
            Company company = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new EntityNotFoundException("Company", request.companyId()));
            user.setCompany(company);
        }

        return userRepository.save(user);
    }
}
