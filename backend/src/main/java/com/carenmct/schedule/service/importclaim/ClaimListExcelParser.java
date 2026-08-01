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
public class ClaimListExcelParser {

    public List<RawClaimListExcelRow> parse(InputStream inputStream) {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역 엑셀 시트가 없습니다.");
            }
            if (sheet.getRow(0) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역 엑셀 헤더가 없습니다.");
            }

            List<RawClaimListExcelRow> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || ExcelCellReaders.isBlankRow(row, 16)) {
                    continue;
                }
                LocalDate serviceDate = ExcelCellReaders.readDate(row.getCell(0));
                LocalTime workStart = ExcelCellReaders.readTime(row.getCell(11));
                LocalTime workEnd = ExcelCellReaders.readTime(row.getCell(12));
                String recipientName = ExcelCellReaders.readString(row.getCell(3));
                String certNo = ExcelCellReaders.readString(row.getCell(4));
                String workerName = ExcelCellReaders.readString(row.getCell(5));
                LocalDate workerDob = ExcelCellReaders.readDate(row.getCell(6));
                if (serviceDate == null
                        || workStart == null
                        || workEnd == null
                        || !StringUtils.hasText(recipientName)
                        || !StringUtils.hasText(certNo)
                        || !StringUtils.hasText(workerName)
                        || workerDob == null) {
                    continue;
                }
                rows.add(new RawClaimListExcelRow(
                        r + 1,
                        serviceDate,
                        workStart,
                        workEnd,
                        recipientName.trim(),
                        certNo.trim(),
                        workerName.trim(),
                        workerDob,
                        ExcelCellReaders.readString(row.getCell(8)),
                        ExcelCellReaders.readString(row.getCell(9)),
                        ExcelCellReaders.readString(row.getCell(10)),
                        ExcelCellReaders.readString(row.getCell(13)),
                        ExcelCellReaders.readString(row.getCell(14)),
                        ExcelCellReaders.readString(row.getCell(15))));
            }
            if (rows.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "청구내역에 등록할 행이 없습니다.");
            }
            return rows;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "청구내역 엑셀을 읽을 수 없습니다: " + ex.getMessage());
        }
    }
}
