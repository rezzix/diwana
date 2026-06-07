package com.diwana.job;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "job_config")
public class JobConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    public JobConfig() {}

    public JobConfig(String name, boolean enabled) {
        this.name = name;
        this.enabled = enabled;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getLastRunAt() { return lastRunAt; }
    public void setLastRunAt(Instant lastRunAt) { this.lastRunAt = lastRunAt; }
}
