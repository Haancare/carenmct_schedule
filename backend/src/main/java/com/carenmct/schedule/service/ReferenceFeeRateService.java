package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateItem;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateServiceHeader;
import com.carenmct.schedule.repository.schedule.reference.AnnualFeeRateServiceHeaderRepository;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
public class ReferenceFeeRateService {

    private final AnnualFeeRateServiceHeaderRepository feeRateHeaderRepository;

    public int calculateUnitCost(int year, ServiceType serviceType, int durationMinutes, int gradeNum) {
        return feeRateHeaderRepository
                .findWithItemsByYearAndServiceType(year, serviceType)
                .map(header -> calculateFromHeader(header, durationMinutes, gradeNum))
                .orElse(0);
    }

    private int calculateFromHeader(AnnualFeeRateServiceHeader header, int durationMinutes, int gradeNum) {
        AnnualFeeRateItem item = findMatchingItem(header, durationMinutes);
        if (item == null) {
            return 0;
        }
        int base = item.resolveAmount(gradeNum);
        return applyPartialRule(header, durationMinutes, base);
    }

    private AnnualFeeRateItem findMatchingItem(AnnualFeeRateServiceHeader header, int durationMinutes) {
        for (AnnualFeeRateItem item : header.getItems()) {
            if (item.matchesDuration(durationMinutes)) {
                return item;
            }
        }
        return null;
    }

    private int applyPartialRule(AnnualFeeRateServiceHeader header, int durationMinutes, int base) {
        Integer partialMin = header.getPartialMinMinutes();
        Integer partialMax = header.getPartialMaxMinutes();
        BigDecimal partialRate = header.getPartialRate();
        if (partialMin == null || partialMax == null || partialRate == null) {
            return base;
        }
        if (durationMinutes >= partialMin && durationMinutes < partialMax) {
            double value = base * partialRate.doubleValue();
            return (int) (Math.ceil(value / 10.0) * 10);
        }
        return base;
    }

    static int parseGradeNum(String gradeSnapshot) {
        if (gradeSnapshot == null || gradeSnapshot.isBlank()) {
            return 3;
        }
        if (gradeSnapshot.contains("인지")) {
            return 0;
        }
        for (int i = 0; i < gradeSnapshot.length(); i++) {
            char ch = gradeSnapshot.charAt(i);
            if (ch >= '1' && ch <= '5') {
                return ch - '0';
            }
        }
        try {
            return Integer.parseInt(gradeSnapshot.trim());
        } catch (NumberFormatException ex) {
            return 3;
        }
    }
}
