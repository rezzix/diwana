package com.diwana.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobConfigRepository extends JpaRepository<JobConfig, Long> {
    Optional<JobConfig> findByName(String name);
}
