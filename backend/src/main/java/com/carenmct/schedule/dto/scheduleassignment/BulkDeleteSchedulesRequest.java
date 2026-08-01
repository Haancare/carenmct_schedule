package com.carenmct.schedule.dto.scheduleassignment;

import java.util.List;

public record BulkDeleteSchedulesRequest(List<Long> scheduleIds) {}
