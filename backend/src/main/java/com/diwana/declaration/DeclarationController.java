package com.diwana.declaration;

import com.diwana.common.dto.ApiResponse;
import com.diwana.company.Company;
import com.diwana.company.CompanyService;
import com.diwana.security.AuthHelper;
import com.diwana.tariff.TariffRate;
import com.diwana.tariff.TariffRateRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/declarations")
public class DeclarationController {

    private final DeclarationService declarationService;
    private final DeclarationMapper declarationMapper;
    private final CompanyService companyService;
    private final TariffRateRepository tariffRateRepository;
    private final AuthHelper authHelper;

    public DeclarationController(DeclarationService declarationService, DeclarationMapper declarationMapper,
                                  CompanyService companyService, TariffRateRepository tariffRateRepository,
                                  AuthHelper authHelper) {
        this.declarationService = declarationService;
        this.declarationMapper = declarationMapper;
        this.companyService = companyService;
        this.tariffRateRepository = tariffRateRepository;
        this.authHelper = authHelper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DECLARANT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<DeclarationDto>>> list(@AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        List<Declaration> declarations = declarationService.listByDeclarant(userId);
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDtoList(declarations)));
    }

    @GetMapping("/pending-review")
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<List<DeclarationDto>>> listPendingReview() {
        List<Declaration> declarations = declarationService.listPendingReview();
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDtoList(declarations)));
    }

    @PostMapping
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<DeclarationDto>> create(
            @Valid @RequestBody DeclarationDto.CreateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        Declaration created = declarationService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(declarationMapper.toDto(created)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DECLARANT', 'CONTROLLER')")
    public ResponseEntity<ApiResponse<DeclarationDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(declarationService.getById(id))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<DeclarationDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody DeclarationDto.UpdateRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        Declaration updated = declarationService.update(id, request, userId);
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        declarationService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<DeclarationDto>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        Declaration submitted = declarationService.submit(id, userId);
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(submitted)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<DeclarationDto>> reject(
            @PathVariable Long id,
            @Valid @RequestBody DeclarationDto.RejectRequest request) {
        Declaration rejected = declarationService.reject(id, request.reason());
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(rejected)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('CONTROLLER')")
    public ResponseEntity<ApiResponse<DeclarationDto>> approve(
            @PathVariable Long id) {
        Declaration approved = declarationService.approve(id);
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(approved)));
    }

    @PostMapping("/{id}/resubmit")
    @PreAuthorize("hasRole('DECLARANT')")
    public ResponseEntity<ApiResponse<DeclarationDto>> resubmit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails currentUser) {
        Long userId = authHelper.getCurrentUserId(currentUser);
        Declaration resubmitted = declarationService.resubmit(id, userId);
        return ResponseEntity.ok(ApiResponse.of(declarationMapper.toDto(resubmitted)));
    }

    @GetMapping("/prefill")
    @PreAuthorize("hasAnyRole('DECLARANT', 'CONTROLLER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PrefillData>> prefill(@AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        Company company = companyId != null ? companyService.getById(companyId) : null;

        List<TariffRate> tariffRates = tariffRateRepository.findAll();

        PrefillData data = new PrefillData(
                company != null ? new CompanyPrefill(
                        company.getName(),
                        company.getIce(),
                        company.getRc(),
                        company.getNif(),
                        company.getVatNumber(),
                        company.getAddress(),
                        company.getPhone(),
                        company.getEmail(),
                        company.getBankName(),
                        company.getBankIban(),
                        company.getBankSwift(),
                        company.getCustomsCode()
                ) : null,
                tariffRates.stream().map(t -> new TariffRateDto(
                        t.getId(), t.getHsCode(), t.getDescription(),
                        t.getDutyRate(), t.getVatRate(), t.getUnit(),
                        t.getOrigin() != null ? t.getOrigin().getCode() : null,
                        t.getOrigin() != null ? t.getOrigin().getName() : null
                )).toList()
        );
        return ResponseEntity.ok(ApiResponse.of(data));
    }

    public record PrefillData(CompanyPrefill company, List<TariffRateDto> tariffRates) {}

    public record CompanyPrefill(
            String name, String ice, String rc, String nif, String vatNumber,
            String address, String phone, String email,
            String bankName, String bankIban, String bankSwift, String customsCode
    ) {}

    public record TariffRateDto(
            Long id, String hsCode, String description,
            java.math.BigDecimal dutyRate, java.math.BigDecimal vatRate, String unit,
            String originCode, String originName
    ) {}
}
