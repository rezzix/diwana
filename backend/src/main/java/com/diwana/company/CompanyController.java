package com.diwana.company;

import com.diwana.common.dto.ApiResponse;
import com.diwana.security.AuthHelper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;
    private final CompanyMapper companyMapper;
    private final AuthHelper authHelper;

    public CompanyController(CompanyService companyService, CompanyMapper companyMapper, AuthHelper authHelper) {
        this.companyService = companyService;
        this.companyMapper = companyMapper;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CompanyDto>>> list() {
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDtoList(companyService.listAll())));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN', 'DECLARANT', 'CONTROLLER')")
    public ResponseEntity<ApiResponse<CompanyDto>> getMyCompany(@AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        if (companyId == null) {
            return ResponseEntity.ok(ApiResponse.of(null));
        }
        Company company = companyService.getById(companyId);
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDto(company)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CompanyDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDto(companyService.getById(id))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DECLARANT')")
    public ResponseEntity<ApiResponse<CompanyDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody CompanyDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {

        // DECLARANT can only update their own company
        if (!authHelper.hasAnyRole(currentUser, "ADMIN")) {
            authHelper.requireCompanyAccess(currentUser, id);
        }

        Company updated = companyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.of(companyMapper.toDto(updated)));
    }
}
