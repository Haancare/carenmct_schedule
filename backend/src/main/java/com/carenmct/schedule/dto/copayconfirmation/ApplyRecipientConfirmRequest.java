package com.carenmct.schedule.dto.copayconfirmation;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.util.List;

public record ApplyRecipientConfirmRequest(int year, int month, List<ConfirmSelectionDto> selections) {

    public record ConfirmSelectionDto(
            ServiceType serviceType,
            String periodKey,
            ConfirmAction action,
            Integer count,
            Integer insuranceAmount,
            Integer copayAmount) {}

    public enum ConfirmAction {
        none,
        plan,
        claim,
        manual
    }
}
