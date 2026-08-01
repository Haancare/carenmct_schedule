package com.carenmct.schedule.dto.scheduleassignment;

import java.util.List;

public record BulkCreateSchedulesResponse(List<ScheduleEntryResponse> created, int skipped) {}
