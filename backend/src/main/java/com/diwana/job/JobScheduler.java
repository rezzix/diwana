package com.diwana.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Central scheduler that runs all registered jobs every 60 seconds.
 * Checks JobConfig to determine if each job is enabled.
 * New jobs are registered by adding a @Component that extends Job.
 */
@Component
public class JobScheduler {

    private static final Logger log = LoggerFactory.getLogger(JobScheduler.class);

    private final List<Job> jobs;
    private final JobConfigRepository configRepository;

    public JobScheduler(List<Job> jobs, JobConfigRepository configRepository) {
        this.jobs = jobs;
        this.configRepository = configRepository;
        log.info("[JobScheduler] Registered {} job(s): {}", jobs.size(),
                jobs.stream().map(Job::getName).toList());
    }

    @Scheduled(fixedRate = 60_000)
    public void tick() {
        log.debug("[JobScheduler] Ticking {} job(s)...", jobs.size());
        for (Job job : jobs) {
            try {
                // Check if job is enabled in config
                Optional<JobConfig> config = configRepository.findByName(job.getName());
                if (config.isPresent() && !config.get().isEnabled()) {
                    log.debug("[JobScheduler] Job '{}' is disabled in config — skipping", job.getName());
                    continue;
                }
                job.run();
                // Update last run timestamp
                if (config.isPresent()) {
                    JobConfig c = config.get();
                    c.setLastRunAt(Instant.now());
                    configRepository.save(c);
                }
            } catch (Exception e) {
                log.error("[JobScheduler] Job '{}' threw uncaught exception", job.getName(), e);
            }
        }
    }
}