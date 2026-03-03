package com.ghaith.erp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private StatsDto stats;
    private String systemStatus;
    private List<AlertDto> criticalAlerts;
    private List<HealthDto> health;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatsDto {
        private HrStats hr;
        private FinanceStats finance;
        private FleetStats fleet;
        private SupportStats support;
        private LegalStats legal;
        private ProjectStats projects;
        private PropertyStats property;
        private GovernanceStats governance;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class HrStats {
            private Integer active;
            private Integer pendingLeaves;
            private Integer monthHires;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class FinanceStats {
            private Integer overdue;
            private Integer totalInvoices;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class FleetStats {
            private Integer available;
            private Integer inMaintenance;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class SupportStats {
            private Integer open;
            private Integer critical;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class LegalStats {
            private Integer openCases;
            private Integer expiringContracts;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ProjectStats {
            private Integer active;
            private Integer overdue;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PropertyStats {
            private Integer total;
            private Integer vacant;
        }

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class GovernanceStats {
            private Integer pendingApprovals;
            private Integer openRisks;
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlertDto {
        private String id;
        private String message;
        private String module;
        private String link;
        private String severity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthDto {
        private String id;
        private String nameAr;
        private String status;
        private List<String> issues;
    }
}
