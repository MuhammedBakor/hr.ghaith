package com.ghaith.erp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiSummaryDto {
    private WeekKpi week;
    private CurrentKpi current;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeekKpi {
        private Integer newTickets;
        private Integer resolvedTickets;
        private Double ticketResolutionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentKpi {
        private Integer pendingRequests;
        private Integer activeProjects;
    }
}
