package com.carenmct.schedule.support;

import java.util.Map;
import org.springframework.util.StringUtils;

/** com.employees.position — ST_XX 코드 또는 통합관리 포털 한글 직종명 */
public final class EmployeePositionSupport {

    private static final Map<String, String> LABEL_TO_CODE =
            Map.ofEntries(
                    Map.entry("시설장(관리책임자)", "ST_01"),
                    Map.entry("사무국장", "ST_02"),
                    Map.entry("사회복지사", "ST_03"),
                    Map.entry("간호사", "ST_04"),
                    Map.entry("물리치료사", "ST_05"),
                    Map.entry("작업치료사", "ST_06"),
                    Map.entry("언어치료사", "ST_07"),
                    Map.entry("요양보호사", "ST_08"),
                    Map.entry("간호조무사", "ST_09"),
                    Map.entry("영양사", "ST_10"),
                    Map.entry("조리원", "ST_11"),
                    Map.entry("조리사", "ST_11"),
                    Map.entry("사무원", "ST_12"),
                    Map.entry("운전원", "ST_13"),
                    Map.entry("위생원", "ST_14"));

    private EmployeePositionSupport() {}

    public static String normalizePositionCode(String raw) {
        if (!StringUtils.hasText(raw) || "선택".equals(raw.trim())) {
            return null;
        }
        String value = raw.trim();
        if (value.startsWith("ST_")) {
            return value;
        }
        return LABEL_TO_CODE.getOrDefault(value, value);
    }
}
