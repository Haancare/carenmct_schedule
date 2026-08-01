package com.carenmct.schedule.domain.schedule.copay;

/** Figma CopaymentConfirmation · getSchedulePeriods 와 동일한 세그먼트 키 규칙 */
public final class CopayPeriodKey {

    private CopayPeriodKey() {}

    public static String of(int gradeNum, String reductionSnapshot) {
        return gradeNum + "_" + (reductionSnapshot == null ? "" : reductionSnapshot.trim());
    }

    public static Parsed parse(String periodKey) {
        if (periodKey == null || periodKey.isBlank()) {
            return new Parsed(0, "");
        }
        int sep = periodKey.indexOf('_');
        if (sep <= 0) {
            return new Parsed(0, periodKey);
        }
        int grade = parseGrade(periodKey.substring(0, sep));
        String reduction = periodKey.substring(sep + 1);
        return new Parsed(grade, reduction);
    }

    private static int parseGrade(String raw) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    public record Parsed(int gradeNum, String reductionSnapshot) {}
}
