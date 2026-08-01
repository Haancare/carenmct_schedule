package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import java.util.List;
import java.util.Map;

public record CopaySegmentResolveResult(
        List<CopaySegmentTarget> targets, Map<Long, List<ServiceSchedule>> schedulesByRecipient) {}
