package com.diwana.hscode;

import jakarta.persistence.*;

@Entity
@Table(name = "hs_code")
public class HsCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String code;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, length = 2)
    private String chapter;

    protected HsCode() {}

    public HsCode(String code, String description, String chapter) {
        this.code = code;
        this.description = description;
        this.chapter = chapter;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getChapter() { return chapter; }
    public void setChapter(String chapter) { this.chapter = chapter; }
}