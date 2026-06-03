package com.diwana.declaration;

import com.diwana.common.exception.BadRequestException;
import com.diwana.company.Company;
import com.diwana.company.CompanyService;
import com.diwana.tariff.TariffRate;
import com.diwana.tariff.TariffRateRepository;
import com.diwana.user.User;
import com.diwana.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DeclarationService {

    private final DeclarationRepository declarationRepository;
    private final CompanyService companyService;
    private final UserService userService;
    private final TariffRateRepository tariffRateRepository;

    private final AtomicLong numberCounter = new AtomicLong(System.currentTimeMillis());

    public DeclarationService(DeclarationRepository declarationRepository, CompanyService companyService,
                               UserService userService, TariffRateRepository tariffRateRepository) {
        this.declarationRepository = declarationRepository;
        this.companyService = companyService;
        this.userService = userService;
        this.tariffRateRepository = tariffRateRepository;
    }

    @Transactional
    public Declaration create(DeclarationDto.CreateRequest request, Long userId) {
        User declarant = userService.getById(userId);
        Long companyId = declarant.getCompany() != null ? declarant.getCompany().getId() : null;
        if (companyId == null) {
            throw new BadRequestException("Declarant must be assigned to a company");
        }
        Company company = companyService.getById(companyId);

        // Resolve tariff rates
        BigDecimal dutyRate = request.dutyRate();
        BigDecimal vatRate = request.vatRate();

        if (dutyRate == null || vatRate == null) {
            // Look up from tariff table by HS code
            // Use first 4 chars as chapter for lookup
            String hsChapter = request.hsCode().length() >= 4 ? request.hsCode().substring(0, 4) : request.hsCode();
            TariffRate rate = tariffRateRepository.findByHsCodeStartingWith(hsChapter);
            if (rate != null) {
                if (dutyRate == null) dutyRate = rate.getDutyRate();
                if (vatRate == null) vatRate = rate.getVatRate();
            } else {
                if (dutyRate == null) dutyRate = BigDecimal.ZERO;
                if (vatRate == null) vatRate = BigDecimal.ZERO;
            }
        }

        // Calculate duties
        BigDecimal totalValue = request.totalValue();
        BigDecimal dutyAmount = totalValue.multiply(dutyRate).divide(BigDecimal.valueOf(100));
        BigDecimal vatAmount = totalValue.multiply(vatRate).divide(BigDecimal.valueOf(100));

        // Generate declaration number
        String datePart = DateTimeFormatter.ofPattern("yyMMddHHmm").format(LocalDateTime.now());
        String declNumber = "DEC-" + datePart + "-" + (numberCounter.incrementAndGet() % 10000);

        // Create declaration
        Declaration declaration = new Declaration();
        declaration.setDeclarationNumber(declNumber);
        declaration.setDeclarant(declarant);
        declaration.setCompany(company);
        declaration.setCustomsOffice(request.customsOffice());
        declaration.setTotalDuty(dutyAmount);
        declaration.setTotalVat(vatAmount);
        declaration.setTotalValue(totalValue);
        declaration.setNotes(request.notes());
        declaration.setStatus(Declaration.Status.DRAFT);

        // Create line item
        DeclarationLineItem item = new DeclarationLineItem();
        item.setDeclaration(declaration);
        item.setHsCode(request.hsCode());
        item.setDescription(request.description());
        item.setCountryOfOrigin(request.countryOfOrigin());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit());
        item.setUnitPrice(request.unitPrice());
        item.setTotalValue(totalValue);
        item.setDutyRate(dutyRate);
        item.setDutyAmount(dutyAmount);
        item.setVatRate(vatRate);
        item.setVatAmount(vatAmount);
        item.setCurrency(request.currency() != null ? request.currency() : "MAD");

        declaration.getLineItems().add(item);

        return declarationRepository.save(declaration);
    }

    @Transactional(readOnly = true)
    public Declaration getById(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new com.diwana.common.exception.EntityNotFoundException("Declaration", id));
    }

    @Transactional
    public Declaration update(Long id, DeclarationDto.UpdateRequest request, Long userId) {
        Declaration declaration = getById(id);

        if (declaration.getStatus() != Declaration.Status.DRAFT) {
            throw new BadRequestException("Only draft declarations can be edited");
        }

        User declarant = userService.getById(userId);
        if (!declaration.getDeclarant().getId().equals(declarant.getId())) {
            throw new BadRequestException("You can only edit your own declarations");
        }

        // Clear existing line items and replace
        declaration.getLineItems().clear();

        // Resolve tariff rates
        BigDecimal dutyRate = request.dutyRate();
        BigDecimal vatRate = request.vatRate();

        if (dutyRate == null || vatRate == null) {
            String hsChapter = request.hsCode().length() >= 4 ? request.hsCode().substring(0, 4) : request.hsCode();
            TariffRate rate = tariffRateRepository.findByHsCodeStartingWith(hsChapter);
            if (rate != null) {
                if (dutyRate == null) dutyRate = rate.getDutyRate();
                if (vatRate == null) vatRate = rate.getVatRate();
            } else {
                if (dutyRate == null) dutyRate = BigDecimal.ZERO;
                if (vatRate == null) vatRate = BigDecimal.ZERO;
            }
        }

        BigDecimal totalValue = request.totalValue();
        BigDecimal dutyAmount = totalValue.multiply(dutyRate).divide(BigDecimal.valueOf(100));
        BigDecimal vatAmount = totalValue.multiply(vatRate).divide(BigDecimal.valueOf(100));

        declaration.setCustomsOffice(request.customsOffice());
        declaration.setTotalDuty(dutyAmount);
        declaration.setTotalVat(vatAmount);
        declaration.setTotalValue(totalValue);
        declaration.setNotes(request.notes());

        DeclarationLineItem item = new DeclarationLineItem();
        item.setDeclaration(declaration);
        item.setHsCode(request.hsCode());
        item.setDescription(request.description());
        item.setCountryOfOrigin(request.countryOfOrigin());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit());
        item.setUnitPrice(request.unitPrice());
        item.setTotalValue(totalValue);
        item.setDutyRate(dutyRate);
        item.setDutyAmount(dutyAmount);
        item.setVatRate(vatRate);
        item.setVatAmount(vatAmount);
        item.setCurrency(request.currency() != null ? request.currency() : "MAD");

        declaration.getLineItems().add(item);

        return declarationRepository.save(declaration);
    }
}
