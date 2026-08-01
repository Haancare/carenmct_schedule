package com.carenmct.schedule.dto.paymentassignment;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.util.List;

public record MonthlyScheduleRowDto(
        PaymentAssignmentRecipientDto recipient,
        String key,
        ServiceType serviceType,
        Integer gradeNum,
        String reduction,
        List<Integer> days,
        int totalMinutes,
        int count,
        boolean firstOfRecipient,
        int recRowSpan,
        boolean firstOfPeriod,
        int periodRowSpan) {}
