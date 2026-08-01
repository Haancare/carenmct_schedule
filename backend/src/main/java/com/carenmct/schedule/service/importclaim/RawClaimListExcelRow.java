package com.carenmct.schedule.service.importclaim;

import java.time.LocalDate;
import java.time.LocalTime;

/** 청구내역(목록) 엑셀 원본 행 */
public record RawClaimListExcelRow(
        int rowNo,
        LocalDate serviceDate,
        LocalTime workStartTime,
        LocalTime workEndTime,
        String recipientName,
        String certNo,
        String workerName,
        LocalDate workerDob,
        String workerPosition,
        String familyYn,
        String familyRelation,
        String serviceLabel,
        String feeCode,
        String feeName) {}
