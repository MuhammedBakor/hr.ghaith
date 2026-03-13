package com.ghaith.erp.service;

import com.ghaith.erp.dto.dashboard.*;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final EmployeeRepository employeeRepository;
        private final LeaveRequestRepository leaveRequestRepository;

        public DashboardSummaryDto getSummary(Long branchId) {
                // Aggregate stats from available modules
                // For modules not yet implemented in this backend, we return baseline data to
                // avoid frontend breakage

                long activeCount = branchId != null
                                ? employeeRepository.findByBranch_Id(branchId).size()
                                : employeeRepository.count();
                long leavesCount = branchId != null
                                ? leaveRequestRepository.countByEmployeeBranchId(branchId)
                                : leaveRequestRepository.count();

                DashboardSummaryDto.StatsDto.HrStats hrStats = DashboardSummaryDto.StatsDto.HrStats.builder()
                                .active((int) activeCount)
                                .pendingLeaves((int) leavesCount)
                                .monthHires(0)
                                .build();

                DashboardSummaryDto.StatsDto stats = DashboardSummaryDto.StatsDto.builder()
                                .hr(hrStats)
                                .finance(DashboardSummaryDto.StatsDto.FinanceStats.builder().overdue(0).totalInvoices(0)
                                                .build())
                                .fleet(DashboardSummaryDto.StatsDto.FleetStats.builder().available(0).inMaintenance(0)
                                                .build())
                                .support(DashboardSummaryDto.StatsDto.SupportStats.builder().open(0).critical(0)
                                                .build())
                                .legal(DashboardSummaryDto.StatsDto.LegalStats.builder().openCases(0)
                                                .expiringContracts(0).build())
                                .projects(DashboardSummaryDto.StatsDto.ProjectStats.builder().active(0).overdue(0)
                                                .build())
                                .property(DashboardSummaryDto.StatsDto.PropertyStats.builder().total(0).vacant(0)
                                                .build())
                                .governance(
                                                DashboardSummaryDto.StatsDto.GovernanceStats.builder()
                                                                .pendingApprovals(0).openRisks(0).build())
                                .build();

                return DashboardSummaryDto.builder()
                                .stats(stats)
                                .systemStatus("healthy")
                                .criticalAlerts(new ArrayList<>())
                                .health(List.of(
                                                DashboardSummaryDto.HealthDto.builder()
                                                                .id("hr")
                                                                .nameAr("الموارد البشرية")
                                                                .status("healthy")
                                                                .issues(new ArrayList<>())
                                                                .build()))
                                .build();
        }

        public PendingActionsDto getPendingActions() {
                return PendingActionsDto.builder()
                                .total(0)
                                .items(new ArrayList<>())
                                .build();
        }

        public KpiSummaryDto getKpiSummary() {
                return KpiSummaryDto.builder()
                                .week(KpiSummaryDto.WeekKpi.builder()
                                                .newTickets(0)
                                                .resolvedTickets(0)
                                                .ticketResolutionRate(100.0)
                                                .build())
                                .current(KpiSummaryDto.CurrentKpi.builder()
                                                .pendingRequests(0)
                                                .activeProjects(0)
                                                .build())
                                .build();
        }

        public List<QuickSearchResultDto> search(String query) {
                // Basic search implementation for employees
                List<QuickSearchResultDto> results = new ArrayList<>();
                if (query == null || query.length() < 2)
                        return results;

                employeeRepository.findAll().stream()
                                .filter(e -> (e.getFirstName() + " " + e.getLastName()).toLowerCase()
                                                .contains(query.toLowerCase()))
                                .limit(5)
                                .forEach(e -> results.add(QuickSearchResultDto.builder()
                                                .id(String.valueOf(e.getId()))
                                                .type("employee")
                                                .module("hr")
                                                .title(e.getFirstName() + " " + e.getLastName())
                                                .subtitle(e.getEmail())
                                                .link("/hr/employees/" + e.getId())
                                                .badge("موظف")
                                                .badgeColor("blue")
                                                .build()));

                return results;
        }
}
