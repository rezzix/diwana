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
    private final DeclarationAuditLogRepository auditLogRepository;

    private final AtomicLong numberCounter = new AtomicLong(System.currentTimeMillis());

    public DeclarationService(DeclarationRepository declarationRepository, CompanyService companyService,
                               UserService userService, TariffRateRepository tariffRateRepository,
                               OriginRepository originRepository, DeclarationAuditLogRepository auditLogRepository) {
        this.declarationRepository = declarationRepository;
        this.companyService = companyService;
        this.userService = userService;
        this.tariffRateRepository = tariffRateRepository;
        this.originRepository = originRepository;
        this.auditLogRepository = auditLogRepository;
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

        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.CREATED, null, saved.getStatus().name(), null, declarant);
        return saved;
    }

    private void logAction(Declaration declaration, DeclarationAuditLog.Action action,
                          String fromStatus, String toStatus, String note, User user) {
        DeclarationAuditLog log = new DeclarationAuditLog();
        log.setDeclaration(declaration);
        log.setAction(action);
        log.setFromStatus(fromStatus);
        log.setToStatus(toStatus);
        log.setNote(note);
        log.setUser(user);
        log.setUserName(user != null ? user.getFirstName() + " " + user.getLastName() : "System");
        auditLogRepository.save(log);
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

    @Transactional(readOnly = true)
    public List<Declaration> listPendingReview() {
        return declarationRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(Declaration.Status.SUBMITTED, Declaration.Status.UNDER_REVIEW, Declaration.Status.INFO_REQUESTED));
    }

    @Transactional(readOnly = true)
    public List<Declaration> listPendingReviewByOffice(String customsOfficeName) {
        return declarationRepository.findByStatusInAndCustomsOfficeOrderByCreatedAtAsc(
                List.of(Declaration.Status.SUBMITTED, Declaration.Status.UNDER_REVIEW, Declaration.Status.INFO_REQUESTED),
                customsOfficeName);
    }

    @Transactional
    public Declaration update(Long id, DeclarationDto.UpdateRequest request, Long userId) {
        Declaration declaration = getById(id);

        if (declaration.getStatus() != Declaration.Status.DRAFT && declaration.getStatus() != Declaration.Status.REJECTED
                && declaration.getStatus() != Declaration.Status.INFO_REQUESTED) {
            throw new BadRequestException("Only draft, rejected, or info-requested declarations can be edited");
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

        // If editing a rejected or info-requested declaration, reset to draft and clear notes
        if (declaration.getStatus() == Declaration.Status.REJECTED || declaration.getStatus() == Declaration.Status.INFO_REQUESTED) {
            declaration.setStatus(Declaration.Status.DRAFT);
            declaration.setRejectionReason(null);
            declaration.setInfoRequestNote(null);
        }

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
    public Declaration reject(Long id, String reason, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.SUBMITTED
                && declaration.getStatus() != Declaration.Status.UNDER_REVIEW
                && declaration.getStatus() != Declaration.Status.INFO_REQUESTED) {
            throw new BadRequestException("Only submitted, under-review, or info-requested declarations can be rejected");
        }
        User controller = userService.getById(userId);
        String fromStatus = declaration.getStatus().name();
        declaration.setStatus(Declaration.Status.REJECTED);
        declaration.setRejectionReason(reason);
        declaration.setInfoRequestNote(null);
        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.REJECTED, fromStatus, saved.getStatus().name(), reason, controller);
        return saved;
    }

    @Transactional
    public Declaration approve(Long id, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.SUBMITTED
                && declaration.getStatus() != Declaration.Status.UNDER_REVIEW
                && declaration.getStatus() != Declaration.Status.INFO_REQUESTED) {
            throw new BadRequestException("Only submitted, under-review, or info-requested declarations can be approved");
        }
        User controller = userService.getById(userId);
        String fromStatus = declaration.getStatus().name();
        declaration.setStatus(Declaration.Status.APPROVED);
        declaration.setRejectionReason(null);
        declaration.setInfoRequestNote(null);
        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.APPROVED, fromStatus, saved.getStatus().name(), null, controller);
        return saved;
    }

    @Transactional
    public Declaration requestInfo(Long id, String note, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.SUBMITTED && declaration.getStatus() != Declaration.Status.UNDER_REVIEW) {
            throw new BadRequestException("Only submitted or under-review declarations can be flagged for additional info");
        }
        User controller = userService.getById(userId);
        String fromStatus = declaration.getStatus().name();
        declaration.setStatus(Declaration.Status.INFO_REQUESTED);
        declaration.setInfoRequestNote(note);
        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.INFO_REQUESTED, fromStatus, saved.getStatus().name(), note, controller);
        return saved;
    }

    @Transactional
    public Declaration resubmit(Long id, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.REJECTED && declaration.getStatus() != Declaration.Status.INFO_REQUESTED) {
            throw new BadRequestException("Only rejected or info-requested declarations can be resubmitted");
        }
        User declarant = userService.getById(userId);
        if (!declaration.getDeclarant().getId().equals(declarant.getId())) {
            throw new BadRequestException("You can only resubmit your own declarations");
        }
        String fromStatus = declaration.getStatus().name();
        declaration.setStatus(Declaration.Status.DRAFT);
        declaration.setRejectionReason(null);
        declaration.setInfoRequestNote(null);
        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.RESUBMITTED, fromStatus, saved.getStatus().name(), null, declarant);
        return saved;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.DRAFT && declaration.getStatus() != Declaration.Status.REJECTED
                && declaration.getStatus() != Declaration.Status.INFO_REQUESTED) {
            throw new BadRequestException("Only draft, rejected, or info-requested declarations can be deleted");
        }
        User declarant = userService.getById(userId);
        if (!declaration.getDeclarant().getId().equals(declarant.getId())) {
            throw new BadRequestException("You can only delete your own declarations");
        }
        logAction(declaration, DeclarationAuditLog.Action.DELETED, declaration.getStatus().name(), null, null, declarant);
        declarationRepository.delete(declaration);
    }

    @Transactional
    public Declaration submit(Long id, Long userId) {
        Declaration declaration = getById(id);
        if (declaration.getStatus() != Declaration.Status.DRAFT) {
            throw new BadRequestException("Only draft declarations can be submitted");
        }
        User declarant = userService.getById(userId);
        if (!declaration.getDeclarant().getId().equals(declarant.getId())) {
            throw new BadRequestException("You can only submit your own declarations");
        }
        if (declaration.getLineItems().isEmpty()) {
            throw new BadRequestException("Cannot submit a declaration without line items");
        }
        String fromStatus = declaration.getStatus().name();
        declaration.setStatus(Declaration.Status.SUBMITTED);
        Declaration saved = declarationRepository.save(declaration);
        logAction(saved, DeclarationAuditLog.Action.SUBMITTED, fromStatus, saved.getStatus().name(), null, declarant);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<DeclarationAuditLog> getAuditLog(Long declarationId) {
        return auditLogRepository.findByDeclarationIdOrderByCreatedAtAsc(declarationId);
    }

    private record TariffRateResolver(BigDecimal dutyRate, BigDecimal vatRate) {}
}
