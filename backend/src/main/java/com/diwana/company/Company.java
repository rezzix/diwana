package com.diwana.company;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "company", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name"}),
        @UniqueConstraint(columnNames = {"key_"})
    })
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "key_", nullable = false, unique = true, length = 10)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "ice", length = 15)
    private String ice;

    @Column(name = "rc", length = 20)
    private String rc;

    @Column(name = "nif", length = 20)
    private String nif;

    @Column(name = "vat_number", length = 20)
    private String vatNumber;

    @Column(length = 500)
    private String address;

    @Column(length = 100)
    private String phone;

    @Column(length = 200)
    private String email;

    @Column(name = "bank_name", length = 200)
    private String bankName;

    @Column(name = "bank_iban", length = 34)
    private String bankIban;

    @Column(name = "bank_swift", length = 11)
    private String bankSwift;

    @Column(name = "customs_code", length = 20)
    private String customsCode;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Company() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIce() { return ice; }
    public void setIce(String ice) { this.ice = ice; }
    public String getRc() { return rc; }
    public void setRc(String rc) { this.rc = rc; }
    public String getNif() { return nif; }
    public void setNif(String nif) { this.nif = nif; }
    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankIban() { return bankIban; }
    public void setBankIban(String bankIban) { this.bankIban = bankIban; }
    public String getBankSwift() { return bankSwift; }
    public void setBankSwift(String bankSwift) { this.bankSwift = bankSwift; }
    public String getCustomsCode() { return customsCode; }
    public void setCustomsCode(String customsCode) { this.customsCode = customsCode; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
