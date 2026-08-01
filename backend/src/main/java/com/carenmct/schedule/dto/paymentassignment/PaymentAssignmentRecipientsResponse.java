package com.carenmct.schedule.dto.paymentassignment;

import java.util.List;

public record PaymentAssignmentRecipientsResponse(
        List<PaymentAssignmentRecipientDto> recipients, int totalCount) {}
