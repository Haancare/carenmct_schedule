package com.carenmct.schedule.dto.careplan;

import java.util.List;
import java.util.Map;

/** GET /api/care-plan/recipients 항목 */
public record CarePlanRecipientDto(
        String id,
        String name,
        String legalDob,
        String realDob,
        String gradeText,
        String reduction,
        String certNo,
        String contractStatus,
        String validFrom,
        String validTo,
        String mobile,
        Integer approvedAmtCare,
        Integer approvedAmtBath,
        Integer approvedAmtNursing,
        Integer approvedAmtDay,
        Integer approvedAmtOther,
        List<String> serviceTypes,
        /** docType → 최신 written_date (yyyy-MM-dd), 없으면 키 없음 */
        Map<String, String> latestWrittenDates) {}
