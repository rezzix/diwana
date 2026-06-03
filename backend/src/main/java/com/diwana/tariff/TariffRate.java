package com.diwana.tariff;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "tariff_rate")
public class TariffRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hs_code", nullable = false, unique = true, length = 12)
    private String hsCode;

    @Column(nullable = false)
    private String description;

    @Column(name = "duty_rate", nullable = false, precision = 10, scale = 4)
    private BigDecimal dutyRate;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public TariffRate() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getDutyRate() { return dutyRate; }
    public void setDutyRate(BigDecimal dutyRate) { this.dutyRate = dutyRate; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
