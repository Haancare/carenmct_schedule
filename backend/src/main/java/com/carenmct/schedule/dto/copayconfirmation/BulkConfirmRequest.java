package com.carenmct.schedule.dto.copayconfirmation;

import com.carenmct.schedule.domain.schedule.enums.CopayConfirmType;
import java.util.List;

public record BulkConfirmRequest(
        int year,
        int month,
        CopayConfirmType basis,
        BulkConfirmScope scope,
        List<String> recipientIds,
        String query,
        String status,
        String serviceType) {

    public enum BulkConfirmScope {
        /** 체크된 수급자만 — recipientIds 필수 */
        selected,
        /** 필터 결과 중 미확정 세그먼트만 */
        unconfirmed,
        /** 필터 결과 전체 재확정 */
        all
    }
}
