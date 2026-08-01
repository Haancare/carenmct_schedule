package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;

public final class CopayConfirmationKeys {

    private CopayConfirmationKeys() {}

    public static String segmentKey(
            long recipientId, int year, int month, ServiceType serviceType, String periodKey) {
        return recipientId + "|" + year + "|" + month + "|" + serviceType.name() + "|" + periodKey;
    }
}
