package com.carenmct.schedule.service.copay;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.copay.CopayConfirmation;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator.PeriodSegment;

/** 그리드 행 1건 = 수급자 × 급여유형 × 기간세그먼트 */
public record CopaySegmentTarget(
        Recipient recipient,
        ServiceType serviceType,
        PeriodSegment segment,
        CopayConfirmation existingConfirmation) {}
