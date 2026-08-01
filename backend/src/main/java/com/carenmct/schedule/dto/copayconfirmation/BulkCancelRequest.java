package com.carenmct.schedule.dto.copayconfirmation;

import java.util.List;

public record BulkCancelRequest(
        int year, int month, List<String> recipientIds, String query, String status, String serviceType) {}
