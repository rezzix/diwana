package com.diwana.user;

import com.diwana.common.exception.BadRequestException;
import com.diwana.common.exception.DuplicateKeyException;
import com.diwana.common.exception.EntityNotFoundException;
import com.diwana.company.Company;
import com.diwana.company.CompanyRepository;
import com.diwana.customsoffice.CustomsOffice;
import com.diwana.customsoffice.CustomsOfficeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final CustomsOfficeRepository customsOfficeRepository;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       CompanyRepository companyRepository, CustomsOfficeRepository customsOfficeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.customsOfficeRepository = customsOfficeRepository;
    }

    @Transactional(readOnly = true)
    public Page<User> list(String search, User.Role role, Boolean active, int page, int size, String sort) {
        String[] sortParts = sort.split(",");
        Sort.Direction direction = Sort.Direction.fromString(sortParts.length > 1 ? sortParts[1] : "desc");
        PageRequest pageRequest = PageRequest.of(page, size, direction, sortParts[0]);

        if (role != null) {
            return userRepository.findByRole(role, pageRequest);
        }
        if (active != null) {
            return userRepository.findByActive(active, pageRequest);
        }
        if (search != null && !search.isBlank()) {
            return userRepository.search(search, pageRequest);
        }
        return userRepository.findAll(pageRequest);
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

        if (role == User.Role.DECLARANT && request.companyId() == null) {
            throw new BadRequestException("Declarant users must be assigned to a company");
        }
        if (role == User.Role.CONTROLLER && request.companyId() != null) {
            throw new BadRequestException("Controller users cannot be assigned to a company");
        }
        if (role == User.Role.CONTROLLER && request.customsOfficeId() == null) {
            throw new BadRequestException("Controller users must be assigned to a customs office");
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

        if (request.customsOfficeId() != null) {
            CustomsOffice office = customsOfficeRepository.findById(request.customsOfficeId())
                    .orElseThrow(() -> new EntityNotFoundException("CustomsOffice", request.customsOfficeId()));
            user.setCustomsOffice(office);
        }

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    @Transactional
    public void deactivate(Long id) {
        User user = getById(id);
        user.setActive(false);
        userRepository.save(user);
    }
}
