package com.carenmct.schedule.service.importclaim;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.service.importplan.PlanScheduleRowNormalizer;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ClaimScheduleRowNormalizer {

    public record NormalizeResult(
            List<NormalizedClaimRow> rows, List<String> matchErrors, int listRowCount) {}

    /**
     * 목록·상세 매칭 후 정규화. 매칭 실패 메시지는 {@code matchErrors}에 채운다.
     */
    public NormalizeResult normalizeWithErrors(
            List<RawClaimListExcelRow> listRows, List<RawClaimDetailExcelRow> detailRows) {
        List<RawClaimListExcelRow> withoutSocial = listRows.stream()
                .filter(r -> !isSocialWorker(r.workerPosition()))
                .toList();

        Map<String, List<RawClaimDetailExcelRow>> detailIndex = new HashMap<>();
        for (RawClaimDetailExcelRow detail : detailRows) {
            detailIndex
                    .computeIfAbsent(
                            matchKey(
                                    detail.serviceDate(),
                                    detail.serviceStartTime(),
                                    detail.serviceEndTime(),
                                    detail.recipientName(),
                                    detail.certNo(),
                                    detail.workerName()),
                            ignored -> new ArrayList<>())
                    .add(detail);
        }

        List<MatchedClaimRow> matched = new ArrayList<>();
        List<String> matchErrors = new ArrayList<>();
        for (RawClaimListExcelRow list : withoutSocial) {
            String key = matchKey(
                    list.serviceDate(),
                    list.workStartTime(),
                    list.workEndTime(),
                    list.recipientName(),
                    list.certNo(),
                    list.workerName());
            List<RawClaimDetailExcelRow> candidates = detailIndex.get(key);
            if (candidates == null || candidates.isEmpty()) {
                matchErrors.add("행 " + list.rowNo() + ": 청구내역상세와 매칭되지 않았습니다 ("
                        + list.recipientName()
                        + " / "
                        + list.certNo()
                        + ")");
                continue;
            }
            RawClaimDetailExcelRow detail = candidates.remove(0);
            matched.add(new MatchedClaimRow(list, detail));
        }

        if (matched.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    matchErrors.isEmpty() ? "목록·상세를 매칭할 수 없습니다." : matchErrors.get(0));
        }

        List<MatchedClaimRow> afterBath = mergeBathPairs(matched);
        List<NormalizedClaimRow> rows = new ArrayList<>(afterBath.size());
        for (MatchedClaimRow row : afterBath) {
            rows.add(toNormalized(row));
        }
        return new NormalizeResult(rows, matchErrors, withoutSocial.size());
    }

    private record MatchedClaimRow(
            RawClaimListExcelRow list,
            RawClaimDetailExcelRow detail,
            String secondaryWorkerName,
            LocalDate secondaryWorkerDob) {
        MatchedClaimRow(RawClaimListExcelRow list, RawClaimDetailExcelRow detail) {
            this(list, detail, null, null);
        }

        MatchedClaimRow withSecondary(String name, LocalDate dob) {
            return new MatchedClaimRow(list, detail, name, dob);
        }

        boolean isBath() {
            return StringUtils.hasText(list.serviceLabel()) && list.serviceLabel().contains("목욕");
        }
    }

    private List<MatchedClaimRow> mergeBathPairs(List<MatchedClaimRow> rows) {
        Map<String, List<MatchedClaimRow>> bathGroups = new LinkedHashMap<>();
        List<MatchedClaimRow> others = new ArrayList<>();
        for (MatchedClaimRow row : rows) {
            if (row.isBath()) {
                bathGroups.computeIfAbsent(bathKey(row), ignored -> new ArrayList<>()).add(row);
            } else {
                others.add(row);
            }
        }

        List<MatchedClaimRow> merged = new ArrayList<>(others);
        for (List<MatchedClaimRow> group : bathGroups.values()) {
            if (group.size() == 1) {
                merged.add(group.get(0));
                continue;
            }
            for (int i = 0; i + 1 < group.size(); i += 2) {
                MatchedClaimRow primary = group.get(i);
                MatchedClaimRow secondary = group.get(i + 1);
                LocalTime start = earlier(primary.list.workStartTime(), secondary.list.workStartTime());
                LocalTime end = later(primary.list.workEndTime(), secondary.list.workEndTime());
                RawClaimListExcelRow adjustedList = new RawClaimListExcelRow(
                        primary.list.rowNo(),
                        primary.list.serviceDate(),
                        start,
                        end,
                        primary.list.recipientName(),
                        primary.list.certNo(),
                        primary.list.workerName(),
                        primary.list.workerDob(),
                        primary.list.workerPosition(),
                        "N",
                        null,
                        "방문목욕",
                        primary.list.feeCode(),
                        primary.list.feeName());
                merged.add(new MatchedClaimRow(adjustedList, primary.detail)
                        .withSecondary(secondary.list.workerName(), secondary.list.workerDob()));
            }
            if (group.size() % 2 == 1) {
                merged.add(group.get(group.size() - 1));
            }
        }
        return merged;
    }

    private static String bathKey(MatchedClaimRow row) {
        String fee = StringUtils.hasText(row.list.feeCode())
                ? row.list.feeCode()
                : nullToEmpty(row.detail.feeCode());
        return row.list.certNo() + "|" + row.list.serviceDate() + "|" + fee;
    }

    private NormalizedClaimRow toNormalized(MatchedClaimRow row) {
        ServiceType serviceType = resolveServiceType(row);
        String familyRelation =
                serviceType == ServiceType.family_care ? nullToEmpty(row.list.familyRelation()) : null;
        if (serviceType == ServiceType.family_care && !StringUtils.hasText(familyRelation)) {
            familyRelation = "기타";
        }
        String feeName = StringUtils.hasText(row.list.feeName()) ? row.list.feeName() : row.detail.feeName();
        String bathType =
                serviceType == ServiceType.visit_bath ? PlanScheduleRowNormalizer.resolveBathType(feeName) : null;
        int duration = PlanScheduleRowNormalizer.durationMinutes(row.list.workStartTime(), row.list.workEndTime());
        String feeCode = truncateFeeCode(
                StringUtils.hasText(row.list.feeCode()) ? row.list.feeCode() : row.detail.feeCode());

        return new NormalizedClaimRow(
                row.list.rowNo(),
                row.list.serviceDate(),
                row.list.workStartTime(),
                row.list.workEndTime(),
                duration,
                row.list.recipientName(),
                row.list.certNo(),
                row.list.workerName(),
                row.list.workerDob(),
                row.secondaryWorkerName(),
                row.secondaryWorkerDob(),
                serviceType,
                familyRelation,
                bathType,
                feeCode,
                row.detail.amount());
    }

    private static ServiceType resolveServiceType(MatchedClaimRow row) {
        if (row.isBath() || StringUtils.hasText(row.secondaryWorkerName())) {
            return ServiceType.visit_bath;
        }
        if ("Y".equalsIgnoreCase(nullToEmpty(row.list.familyYn()).trim())) {
            return ServiceType.family_care;
        }
        return ServiceType.visit_care;
    }

    private static String matchKey(
            LocalDate date,
            LocalTime start,
            LocalTime end,
            String recipientName,
            String certNo,
            String workerName) {
        return date + "|" + start + "|" + end + "|" + recipientName + "|" + certNo + "|" + workerName;
    }

    private static boolean isSocialWorker(String position) {
        return StringUtils.hasText(position) && position.contains("사회복지사");
    }

    private static LocalTime earlier(LocalTime a, LocalTime b) {
        return a.isBefore(b) ? a : b;
    }

    private static LocalTime later(LocalTime a, LocalTime b) {
        return a.isAfter(b) ? a : b;
    }

    private static String truncateFeeCode(String feeCode) {
        if (!StringUtils.hasText(feeCode)) {
            return null;
        }
        return feeCode.length() > 10 ? feeCode.substring(0, 10) : feeCode;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
