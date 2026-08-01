package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class RecipientMonthKindCount {

    private final Long recipientId;
    private final int month;
    private final ScheduleKind scheduleKind;
    private final long count;
}
