package com.diwana.job;

public record JobConfigDto(
        Long id,
        String name,
        boolean enabled,
        String lastRunAt
) {
    public static JobConfigDto from(JobConfig config) {
        return new JobConfigDto(
                config.getId(),
                config.getName(),
                config.isEnabled(),
                config.getLastRunAt() != null ? config.getLastRunAt().toString() : null
        );
    }
}
