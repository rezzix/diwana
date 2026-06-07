package com.diwana.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Central scheduler that runs all registered jobs every 60 seconds.
 * Each job decides internally whether to act based on its own criteria
 * (e.g. cooldown since last run, state of the data it processes).
 * New jobs are registered by adding them to the constructor or wiring
 * them via @Autowired into the list.
 */
@Component
public class JobScheduler {

    private static final Logger log = LoggerFactory.getLogger(JobScheduler.class);

    private final List<Job> jobs;

    public JobScheduler(List<Job> jobs) {
        this.jobs = jobs;
        log.info("[JobScheduler] Registered {} job(s): {}", jobs.size(),
                jobs.stream().map(Job::getName).toList());
    }

    @Scheduled(fixedRate = 60_000)
    public void tick() {
        log.debug("[JobScheduler] Ticking {} job(s)...", jobs.size());
        for (Job job : jobs) {
            try {
                job.run();
            } catch (Exception e) {
                log.error("[JobScheduler] Job '{}' threw uncaught exception", job.getName(), e);
            }
        }
    }
}