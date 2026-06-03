package com.diwana.declaration;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "declaration_line_item")
public class DeclarationLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declaration_id", nullable = false)
    private Declaration declaration;

    @Column(name = "hs_code", nullable = false, length = 12)
    private String hsCode;

    @Column(nullable = false)
    private String description;

    @Column(name = "country_of_origin", length = 100)
    private String countryOfOrigin;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", length = 10)
    private String unit;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "total_value", nullable = false, precision = 15, scale = 4)
    private BigDecimal totalValue;

    @Column(name = "duty_rate", precision = 10, scale = 4)
    private BigDecimal dutyRate;

    @Column(name = "duty_amount", precision = 15, scale = 4)
    private BigDecimal dutyAmount;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "vat_amount", precision = 15, scale = 4)
    private BigDecimal vatAmount;

    @Column(length = 3)
    private String currency = "MAD";

    public DeclarationLineItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Declaration getDeclaration() { return declaration; }
    public void setDeclaration(Declaration declaration) { this.declaration = declaration; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCountryOfOrigin() { return countryOfOrigin; }
    public void setCountryOfOrigin(String countryOfOrigin) { this.countryOfOrigin = countryOfOrigin; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getTotalValue() { return totalValue; }
    public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
    public BigDecimal getDutyRate() { return dutyRate; }
    public void setDutyRate(BigDecimal dutyRate) { this.dutyRate = dutyRate; }
    public BigDecimal getDutyAmount() { return dutyAmount; }
    public void setDutyAmount(BigDecimal dutyAmount) { this.dutyAmount = dutyAmount; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public BigDecimal getVatAmount() { return vatAmount; }
    public void setVatAmount(BigDecimal vatAmount) { this.vatAmount = vatAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
