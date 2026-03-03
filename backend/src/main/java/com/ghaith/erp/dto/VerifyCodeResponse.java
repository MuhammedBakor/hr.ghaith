package com.ghaith.erp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerifyCodeResponse {
    private boolean success;
    private SubscriptionDto subscription;
    private String error;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SubscriptionDto {
        private String code;
        private String companyName;
    }
}
