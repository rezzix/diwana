package com.diwana.declaration;

import com.diwana.company.Company;
import com.diwana.company.CompanyService;
import com.diwana.security.AuthHelper;
import com.diwana.tariff.TariffRate;
import com.diwana.tariff.TariffRateRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/declarations")
public class DeclarationController {

    private final CompanyService companyService;
    private final TariffRateRepository tariffRateRepository;
    private final AuthHelper authHelper;

    public DeclarationController(CompanyService companyService, TariffRateRepository tariffRateRepository,
                                  AuthHelper authHelper) {
        this.companyService = companyService;
        this.tariffRateRepository = tariffRateRepository;
        this.authHelper = authHelper;
    }

    @GetMapping("/prefill")
    public PrefillData prefill(@AuthenticationPrincipal UserDetails currentUser) {
        Long companyId = authHelper.getCurrentCompanyId(currentUser);
        Company company = companyId != null ? companyService.getById(companyId) : null;

        List<TariffRate> tariffRates = tariffRateRepository.findAll();

        return new PrefillData(
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
                        t.getDutyRate(), t.getVatRate(), t.getUnit()
                )).toList()
        );
    }

    public record PrefillData(CompanyPrefill company, List<TariffRateDto> tariffRates) {}

    public record CompanyPrefill(
            String name, String ice, String rc, String nif, String vatNumber,
            String address, String phone, String email,
            String bankName, String bankIban, String bankSwift, String customsCode
    ) {}

    public record TariffRateDto(
            Long id, String hsCode, String description,
            java.math.BigDecimal dutyRate, java.math.BigDecimal vatRate, String unit
    ) {}
}
