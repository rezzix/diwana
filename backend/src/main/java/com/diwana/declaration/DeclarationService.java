package com.diwana.declaration;

import com.diwana.common.exception.BadRequestException;
import com.diwana.company.Company;
import com.diwana.company.CompanyService;
import com.diwana.origin.Origin;
import com.diwana.origin.OriginRepository;
import com.diwana.tariff.TariffRate;
import com.diwana.tariff.TariffRateRepository;
import com.diwana.user.User;
import com.diwana.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DeclarationService {

    private final DeclarationRepository declarationRepository;
    private final CompanyService companyService;
    private final UserService userService;
    private final TariffRateRepository tariffRateRepository;
    private final OriginRepository originRepository;

    private final AtomicLong numberCounter = new AtomicLong(System.currentTimeMillis());

    public DeclarationService(DeclarationRepository declarationRepository, CompanyService companyService,
                               UserService userService, TariffRateRepository tariffRateRepository,
                               OriginRepository originRepository) {
        this.declarationRepository = declarationRepository;
        this.companyService = companyService;
        this.userService = userService;
        this.tariffRateRepository = tariffRateRepository;
        this.originRepository = originRepository;
    }

    @Transactional
    public Declaration create(DeclarationDto.CreateRequest request, Long userId) {
        User declarant = userService.getById(userId);
        Long companyId = declarant.getCompany() != null ? declarant.getCompany().getId() : null;
        if (companyId == null) {
            throw new BadRequestException("Declarant must be assigned to a company");
        }
        Company company = companyService.getById(companyId);

        String datePart = DateTimeFormatter.ofPattern("yyMMddHHmm").format(LocalDateTime.now());
        String declNumber = "DEC-" + datePart + "-" + (numberCounter.incrementAndGet() % 10000);

        Declaration declaration = new Declaration();
        declaration.setDeclarationNumber(declNumber);
        declaration.setDeclarant(declarant);
        declaration.setCompany(company);
        declaration.setCustomsOffice(request.customsOffice());
        declaration.setNotes(request.notes());
        declaration.setStatus(Declaration.Status.DRAFT);

        BigDecimal totalDuty = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;
        BigDecimal totalValue = BigDecimal.ZERO;

        for (DeclarationDto.LineItemRequest li : request.lineItems()) {
            TariffRateResolver resolved = resolveRates(li.hsCode(), li.countryOfOrigin(), li.dutyRate(), li.vatRate());
            BigDecimal lineTotal = li.totalValue();
            BigDecimal dutyAmount = lineTotal.multiply(resolved.dutyRate()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal vatAmount = lineTotal.multiply(resolved.vatRate()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            totalDuty = totalDuty.add(dutyAmount);
            totalVat = totalVat.add(vatAmount);
            totalValue = totalValue.add(lineTotal);

            DeclarationLineItem item = buildLineItem(declaration, li, resolved.dutyRate(), resolved.vatRate(), dutyAmount, vatAmount);
            declaration.getLineItems().add(item);
        }

        declaration.setTotalDuty(totalDuty);
        declaration.setTotalVat(totalVat);
        declaration.setTotalValue(totalValue);

        return declarationRepository.save(declaration);
    }

    @Transactional(readOnly = true)
    public Declaration getById(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new com.diwana.common.exception.EntityNotFoundException("Declaration", id));
    }

    @Transactional(readOnly = true)
    public List<Declaration> listByDeclarant(Long declarantId) {
        return declarationRepository.findByDeclarantIdOrderByCreatedAtDesc(declarantId);
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

        declaration.getLineItems().clear();
        declaration.setCustomsOffice(request.customsOffice());
        declaration.setNotes(request.notes());

        BigDecimal totalDuty = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;
        BigDecimal totalValue = BigDecimal.ZERO;

        for (DeclarationDto.LineItemRequest li : request.lineItems()) {
            TariffRateResolver resolved = resolveRates(li.hsCode(), li.countryOfOrigin(), li.dutyRate(), li.vatRate());
            BigDecimal lineTotal = li.totalValue();
            BigDecimal dutyAmount = lineTotal.multiply(resolved.dutyRate()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            BigDecimal vatAmount = lineTotal.multiply(resolved.vatRate()).divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            totalDuty = totalDuty.add(dutyAmount);
            totalVat = totalVat.add(vatAmount);
            totalValue = totalValue.add(lineTotal);

            DeclarationLineItem item = buildLineItem(declaration, li, resolved.dutyRate(), resolved.vatRate(), dutyAmount, vatAmount);
            declaration.getLineItems().add(item);
        }

        declaration.setTotalDuty(totalDuty);
        declaration.setTotalVat(totalVat);
        declaration.setTotalValue(totalValue);

        return declarationRepository.save(declaration);
    }

    private TariffRateResolver resolveRates(String hsCode, String countryOfOrigin, BigDecimal dutyRate, BigDecimal vatRate) {
        if (dutyRate != null && vatRate != null) {
            return new TariffRateResolver(dutyRate, vatRate);
        }

        String hsChapter = hsCode.length() >= 4 ? hsCode.substring(0, 4) : hsCode;

        // Resolve origin from country name
        Origin origin = null;
        if (countryOfOrigin != null && !countryOfOrigin.isBlank()) {
            origin = originRepository.findByName(countryOfOrigin).orElse(null);
        }

        TariffRate rate = null;

        if (origin != null) {
            // Level 1: same origin + exact HS code
            rate = tariffRateRepository.findByOriginAndHsCodeAndActiveTrue(origin, hsCode);
            // Level 2: same origin + parent HS code
            if (rate == null) {
                rate = tariffRateRepository.findFirstByOriginAndHsCodeStartingWithAndActiveTrue(origin, hsChapter);
            }
            // Level 3: same origin + no HS code (origin-wide default)
            if (rate == null) {
                rate = tariffRateRepository.findByOriginAndHsCodeIsNullAndActiveTrue(origin);
            }
        }

        // Level 4: no origin + exact HS code (HS-specific default)
        if (rate == null) {
            rate = tariffRateRepository.findByOriginIsNullAndHsCodeAndActiveTrue(hsCode);
        }
        // Level 5: no origin + parent HS code (HS-category default)
        if (rate == null) {
            rate = tariffRateRepository.findFirstByOriginIsNullAndHsCodeStartingWithAndActiveTrue(hsChapter);
        }
        // Level 6: no origin + no HS code (global default)
        if (rate == null) {
            rate = tariffRateRepository.findByOriginIsNullAndHsCodeIsNullAndActiveTrue();
        }

        if (rate != null) {
            if (dutyRate == null) dutyRate = rate.getDutyRate();
            if (vatRate == null) vatRate = rate.getVatRate();
        } else {
            if (dutyRate == null) dutyRate = BigDecimal.ZERO;
            if (vatRate == null) vatRate = BigDecimal.ZERO;
        }

        return new TariffRateResolver(dutyRate, vatRate);
    }

    private DeclarationLineItem buildLineItem(Declaration declaration, DeclarationDto.LineItemRequest li,
                                               BigDecimal dutyRate, BigDecimal vatRate,
                                               BigDecimal dutyAmount, BigDecimal vatAmount) {
        DeclarationLineItem item = new DeclarationLineItem();
        item.setDeclaration(declaration);
        item.setHsCode(li.hsCode());
        item.setDescription(li.description());
        item.setCountryOfOrigin(li.countryOfOrigin());
        item.setQuantity(li.quantity());
        item.setUnit(li.unit());
        item.setUnitPrice(li.unitPrice());
        item.setTotalValue(li.totalValue());
        item.setDutyRate(dutyRate);
        item.setDutyAmount(dutyAmount);
        item.setVatRate(vatRate);
        item.setVatAmount(vatAmount);
        item.setCurrency(li.currency() != null ? li.currency() : "MAD");
        return item;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.DRAFT) {
            throw new BadRequestException("Only draft declarations can be deleted");
        }
        User declarant = userService.getById(userId);
        if (!declaration.getDeclarant().getId().equals(declarant.getId())) {
            throw new BadRequestException("You can only delete your own declarations");
        }
        declarationRepository.delete(declaration);
    }

    private record TariffRateResolver(BigDecimal dutyRate, BigDecimal vatRate) {}
}
