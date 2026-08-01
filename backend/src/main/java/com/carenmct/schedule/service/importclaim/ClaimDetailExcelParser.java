package com.carenmct.schedule.service.importclaim;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ClaimDetailExcelParser {

    private static final LocalTime MIDNIGHT = LocalTime.of(0, 0);

    public List<RawClaimDetailExcelRow> parse(InputStream inputStream) {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역상세 엑셀 시트가 없습니다.");
            }
            if (sheet.getRow(0) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역상세 엑셀 헤더가 없습니다.");
            }

            List<RawClaimDetailExcelRow> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || ExcelCellReaders.isBlankRow(row, 12)) {
                    continue;
                }
                LocalDate serviceDate = ExcelCellReaders.readDate(row.getCell(3));
                LocalTime start = ExcelCellReaders.readTime(row.getCell(4));
                LocalTime end = ExcelCellReaders.readTime(row.getCell(5));
                String recipientName = ExcelCellReaders.readString(row.getCell(1));
                String certNo = ExcelCellReaders.readString(row.getCell(2));
                String workerName = ExcelCellReaders.readString(row.getCell(6));
                String feeName = ExcelCellReaders.readString(row.getCell(8));
                Integer amount = ExcelCellReaders.readInteger(row.getCell(9));

                if (serviceDate == null
                        || start == null
                        || end == null
                        || !StringUtils.hasText(recipientName)
                        || !StringUtils.hasText(certNo)
                        || !StringUtils.hasText(workerName)
                        || amount == null) {
                    continue;
                }
                if (MIDNIGHT.equals(start) || MIDNIGHT.equals(end)) {
                    continue;
                }
                if (StringUtils.hasText(feeName) && feeName.contains("중증수급자 가산")) {
                    continue;
                }

                rows.add(new RawClaimDetailExcelRow(
                        r + 1,
                        serviceDate,
                        start,
                        end,
                        recipientName.trim(),
                        certNo.trim(),
                        workerName.trim(),
                        ExcelCellReaders.readString(row.getCell(7)),
                        feeName,
                        amount));
            }
            if (rows.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역상세에 매칭 가능한 행이 없습니다.");
            }
            return rows;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "청구내역상세 엑셀을 읽을 수 없습니다: " + ex.getMessage());
        }
    }
}
