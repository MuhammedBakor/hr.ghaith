package com.ghaith.erp.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickSearchResultDto {
    private String id;
    private String type;
    private String module;
    private String title;
    private String subtitle;
    private String link;
    private String badge;
    private String badgeColor;
}
