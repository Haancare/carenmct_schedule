package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualBenefitLimit;
import com.carenmct.schedule.repository.schedule.reference.AnnualBenefitLimitRepository;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
public class ReferenceBenefitLimitService {

    private static final int DEFAULT_LIMIT = 1_528_200;
    private static final Set<ServiceType> LIMIT_SERVICE_TYPES = EnumSet.of(
            ServiceType.visit_care,
            ServiceType.family_care,
            ServiceType.full_day_visit,
            ServiceType.visit_bath,
            ServiceType.day_care);

    private final AnnualBenefitLimitRepository benefitLimitRepository;

    public int resolveMonthlyLimit(
            int year, List<ServiceSchedule> monthSchedules, String recipientGradeText) {
        int gradeNum = resolveGradeFromSchedules(monthSchedules, recipientGradeText);
        return lookupLimit(year, gradeNum);
    }

    private int resolveGradeFromSchedules(List<ServiceSchedule> monthSchedules, String recipientGradeText) {
        int minGrade = 99;
        for (ServiceSchedule schedule : monthSchedules) {
            if (!LIMIT_SERVICE_TYPES.contains(schedule.getServiceType())) {
                continue;
            }
            int grade = parseGradeNum(schedule.getGradeSnapshot(), recipientGradeText);
            if (grade < minGrade) {
                minGrade = grade;
            }
        }
        if (minGrade == 99) {
            return parseGradeNum(recipientGradeText, recipientGradeText);
        }
        return minGrade;
    }

    public int lookupLimit(int year, int gradeNum) {
        return benefitLimitRepository
                .findByBenefitYear(year)
                .map(limit -> limit.limitForGrade(gradeNum))
                .orElse(DEFAULT_LIMIT);
    }

    public static int parseGradeNum(String gradeSnapshot, String fallbackGradeText) {
        String source = gradeSnapshot != null && !gradeSnapshot.isBlank() ? gradeSnapshot : fallbackGradeText;
        if (source == null) {
            return 3;
        }
        if (source.contains("인지")) {
            return 0;
        }
        for (int i = 0; i < source.length(); i++) {
            char ch = source.charAt(i);
            if (ch >= '1' && ch <= '5') {
                return ch - '0';
            }
        }
        return 3;
    }
}
