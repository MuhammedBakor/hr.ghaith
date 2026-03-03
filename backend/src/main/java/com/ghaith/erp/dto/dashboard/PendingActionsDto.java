package com.ghaith.erp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingActionsDto {
    private Integer total;
    private List<PendingActionItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingActionItemDto {
        private Long id;
        private String type;
        private String title;
        private String priority;
        private String link;
        private LocalDateTime createdAt;
    }
}
