package com.diwana.declaration;

import com.diwana.company.Company;
import com.diwana.user.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "declaration")
public class Declaration {

    public enum Status { DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_number", unique = true, length = 50)
    private String declarationNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declarant_id", nullable = false)
    private User declarant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "customs_office", length = 100)
    private String customsOffice;

    @Column(name = "total_duty", precision = 15, scale = 4)
    private BigDecimal totalDuty;

    @Column(name = "total_vat", precision = 15, scale = 4)
    private BigDecimal totalVat;

    @Column(name = "total_value", precision = 15, scale = 4)
    private BigDecimal totalValue;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "declaration", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<DeclarationLineItem> lineItems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Declaration() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDeclarationNumber() { return declarationNumber; }
    public void setDeclarationNumber(String declarationNumber) { this.declarationNumber = declarationNumber; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public User getDeclarant() { return declarant; }
    public void setDeclarant(User declarant) { this.declarant = declarant; }
    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
    public String getCustomsOffice() { return customsOffice; }
    public void setCustomsOffice(String customsOffice) { this.customsOffice = customsOffice; }
    public BigDecimal getTotalDuty() { return totalDuty; }
    public void setTotalDuty(BigDecimal totalDuty) { this.totalDuty = totalDuty; }
    public BigDecimal getTotalVat() { return totalVat; }
    public void setTotalVat(BigDecimal totalVat) { this.totalVat = totalVat; }
    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public List<DeclarationLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<DeclarationLineItem> lineItems) { this.lineItems = lineItems; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
