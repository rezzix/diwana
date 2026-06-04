package com.diwana.dashboard;

import java.util.Map;

public class DashboardStats {

    private final String role;
    private AdminStats adminStats;
    private DeclarantStats declarantStats;
    private ControllerStats controllerStats;

    public DashboardStats(String role) {
        this.role = role;
    }

    public String getRole() { return role; }
    public AdminStats getAdminStats() { return adminStats; }
    public void setAdminStats(AdminStats adminStats) { this.adminStats = adminStats; }
    public DeclarantStats getDeclarantStats() { return declarantStats; }
    public void setDeclarantStats(DeclarantStats declarantStats) { this.declarantStats = declarantStats; }
    public ControllerStats getControllerStats() { return controllerStats; }
    public void setControllerStats(ControllerStats controllerStats) { this.controllerStats = controllerStats; }

    public record AdminStats(long totalUsers, long activeUsers, long inactiveUsers, Map<String, Long> byRole) {}
    public record DeclarantStats(long totalDeclarations, Map<String, Long> byStatus) {}
    public record ControllerStats(long totalPending, Map<String, Long> byStatus, String officeName) {}
}