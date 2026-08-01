package com.carenmct.schedule.service.importplan;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PlanScheduleRowNormalizer {

    public List<NormalizedPlanRow> normalize(List<RawPlanExcelRow> rawRows) {
        List<RawPlanExcelRow> withoutSocial = rawRows.stream()
                .filter(r -> !isSocialWorker(r.workerPosition()))
                .toList();

        List<RawPlanExcelRow> afterBathMerge = mergeBathPairs(withoutSocial);
        List<RawPlanExcelRow> afterDedupe = dedupeIdenticalWorkerRows(afterBathMerge);

        List<NormalizedPlanRow> result = new ArrayList<>(afterDedupe.size());
        for (RawPlanExcelRow row : afterDedupe) {
            result.add(toNormalized(row));
        }
        return result;
    }

    private static boolean isSocialWorker(String position) {
        return StringUtils.hasText(position) && position.contains("사회복지사");
    }

    private static boolean isBath(String serviceLabel) {
        return StringUtils.hasText(serviceLabel) && serviceLabel.contains("목욕");
    }

    private List<RawPlanExcelRow> mergeBathPairs(List<RawPlanExcelRow> rows) {
        Map<String, List<RawPlanExcelRow>> bathGroups = new LinkedHashMap<>();
        List<RawPlanExcelRow> others = new ArrayList<>();
        for (RawPlanExcelRow row : rows) {
            if (isBath(row.serviceLabel())) {
                bathGroups.computeIfAbsent(bathKey(row), ignored -> new ArrayList<>()).add(row);
            } else {
                others.add(row);
            }
        }

        List<RawPlanExcelRow> merged = new ArrayList<>(others);
        for (List<RawPlanExcelRow> group : bathGroups.values()) {
            if (group.size() == 1) {
                merged.add(group.get(0).withoutSecondary());
                continue;
            }
            RawPlanExcelRow primary = group.get(0);
            RawPlanExcelRow secondary = group.get(1);
            merged.add(primary.withSecondary(secondary.workerName(), secondary.workerDob()));
        }
        return merged;
    }

    private static String bathKey(RawPlanExcelRow row) {
        return row.certNo()
                + "|"
                + row.serviceDate()
                + "|"
                + row.startTime()
                + "|"
                + row.endTime();
    }

    /** 240분 초과 분할로 동일 시간·동일 요양보호사가 2행인 경우 1건만 유지 */
    private List<RawPlanExcelRow> dedupeIdenticalWorkerRows(List<RawPlanExcelRow> rows) {
        Map<String, RawPlanExcelRow> unique = new LinkedHashMap<>();
        for (RawPlanExcelRow row : rows) {
            String key = row.certNo()
                    + "|"
                    + row.serviceDate()
                    + "|"
                    + row.startTime()
                    + "|"
                    + row.endTime()
                    + "|"
                    + row.workerName()
                    + "|"
                    + row.workerDob()
                    + "|"
                    + nullToEmpty(row.secondaryWorkerName());
            unique.putIfAbsent(key, row);
        }
        return new ArrayList<>(unique.values());
    }

    private NormalizedPlanRow toNormalized(RawPlanExcelRow row) {
        ServiceType serviceType = resolveServiceType(row);
        String familyRelation =
                serviceType == ServiceType.family_care ? nullToEmpty(row.familyRelation()) : null;
        if (serviceType == ServiceType.family_care && !StringUtils.hasText(familyRelation)) {
            familyRelation = "기타";
        }
        String bathType =
                serviceType == ServiceType.visit_bath ? resolveBathType(row.feeName()) : null;
        int duration = durationMinutes(row.startTime(), row.endTime());

        return new NormalizedPlanRow(
                row.rowNo(),
                row.serviceDate(),
                row.startTime(),
                row.endTime(),
                duration,
                row.recipientName(),
                row.certNo(),
                row.workerName(),
                row.workerDob(),
                row.secondaryWorkerName(),
                row.secondaryWorkerDob(),
                serviceType,
                familyRelation,
                bathType);
    }

    private static ServiceType resolveServiceType(RawPlanExcelRow row) {
        if (isBath(row.serviceLabel()) || StringUtils.hasText(row.secondaryWorkerName())) {
            return ServiceType.visit_bath;
        }
        if ("Y".equalsIgnoreCase(nullToEmpty(row.familyYn()).trim())) {
            return ServiceType.family_care;
        }
        return ServiceType.visit_care;
    }

    public static String resolveBathType(String feeName) {
        String name = nullToEmpty(feeName);
        if (name.contains("이용하지 아니") || name.contains("미이용")) {
            return "차량미이용";
        }
        if (name.contains("가정")) {
            return "차량이용(가정내)";
        }
        if (name.contains("차량")) {
            return "차량이용(차량내)";
        }
        return "차량미이용";
    }

    public static int durationMinutes(LocalTime start, LocalTime end) {
        int startMin = start.getHour() * 60 + start.getMinute();
        int endMin = end.getHour() * 60 + end.getMinute();
        int duration = endMin - startMin;
        if (duration <= 0) {
            duration += 24 * 60;
        }
        return duration;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
