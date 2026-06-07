package com.diwana.job;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Base class for all scheduled jobs in the system.
 * Subclasses implement execute() and provide a name and run-interval.
 * Later: jobs can be enabled/disabled via the database or configuration.
 */
public abstract class Job {

    protected final Logger log = LoggerFactory.getLogger(getClass());

    /** Unique job identifier. */
    public abstract String getName();

    /** Whether this job is enabled. Override to read from config or DB. */
    public boolean isEnabled() {
        return true;
    }

    /** The main job logic. Called on each scheduled tick. */
    protected abstract void execute();

    /** Called by the scheduler. Wraps execute() with logging and error handling. */
    public final void run() {
        if (!isEnabled()) {
            log.debug("[Job][{}] Skipped — job is disabled", getName());
            return;
        }
        log.debug("[Job][{}] Starting...", getName());
        long start = System.currentTimeMillis();
        try {
            execute();
            log.info("[Job][{}] Completed in {}ms", getName(), System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("[Job][{}] Failed after {}ms: {}", getName(), System.currentTimeMillis() - start, e.getMessage(), e);
        }
    }
}