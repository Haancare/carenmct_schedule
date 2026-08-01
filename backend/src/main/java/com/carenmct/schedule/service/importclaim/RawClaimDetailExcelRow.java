package com.carenmct.schedule.service.importclaim;

import java.time.LocalDate;
import java.time.LocalTime;

/** 청구내역상세 엑셀 원본 행 */
public record RawClaimDetailExcelRow(
        int rowNo,
        LocalDate serviceDate,
        LocalTime serviceStartTime,
        LocalTime serviceEndTime,
        String recipientName,
        String certNo,
        String workerName,
        String feeCode,
        String feeName,
        int amount) {}
