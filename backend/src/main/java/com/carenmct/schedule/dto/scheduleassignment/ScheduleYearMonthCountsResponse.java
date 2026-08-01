package com.carenmct.schedule.dto.scheduleassignment;

import java.util.Map;

public record ScheduleYearMonthCountsResponse(Map<Integer, MonthKindCountDto> counts) {

    public record MonthKindCountDto(int plan, int claim) {}
}
