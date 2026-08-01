package com.carenmct.schedule.service.importplan;

import java.time.LocalDate;
import java.time.LocalTime;

/** 엑셀 원본 행 (+ 목욕 2인 병합 시 secondary) */
public record RawPlanExcelRow(
        int rowNo,
        LocalDate serviceDate,
        LocalTime startTime,
        LocalTime endTime,
        String recipientName,
        String certNo,
        String workerName,
        LocalDate workerDob,
        String workerPosition,
        String familyYn,
        String familyRelation,
        String serviceLabel,
        String feeName,
        String secondaryWorkerName,
        LocalDate secondaryWorkerDob) {

    RawPlanExcelRow withoutSecondary() {
        return new RawPlanExcelRow(
                rowNo,
                serviceDate,
                startTime,
                endTime,
                recipientName,
                certNo,
                workerName,
                workerDob,
                workerPosition,
                familyYn,
                familyRelation,
                serviceLabel,
                feeName,
                null,
                null);
    }

    RawPlanExcelRow withSecondary(String name, LocalDate dob) {
        return new RawPlanExcelRow(
                rowNo,
                serviceDate,
                startTime,
                endTime,
                recipientName,
                certNo,
                workerName,
                workerDob,
                workerPosition,
                "N",
                null,
                "방문목욕",
                feeName,
                name,
                dob);
    }
}
