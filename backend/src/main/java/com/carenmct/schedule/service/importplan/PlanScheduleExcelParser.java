package com.carenmct.schedule.service.importplan;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Component
public class PlanScheduleExcelParser {

    private static final DataFormatter FORMATTER = new DataFormatter();

    public List<RawPlanExcelRow> parse(InputStream inputStream) {
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "엑셀 시트가 없습니다.");
            }

            Row header = sheet.getRow(0);
            if (header == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "엑셀 헤더가 없습니다.");
            }

            List<RawPlanExcelRow> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isBlankRow(row)) {
                    continue;
                }
                LocalDate serviceDate = readDate(row.getCell(0));
                LocalTime startTime = readTime(row.getCell(1));
                LocalTime endTime = readTime(row.getCell(2));
                String recipientName = readString(row.getCell(3));
                String certNo = readString(row.getCell(4));
                String workerName = readString(row.getCell(5));
                LocalDate workerDob = readDate(row.getCell(6));
                if (serviceDate == null
                        || startTime == null
                        || endTime == null
                        || !StringUtils.hasText(recipientName)
                        || !StringUtils.hasText(certNo)
                        || !StringUtils.hasText(workerName)
                        || workerDob == null) {
                    continue;
                }
                rows.add(new RawPlanExcelRow(
                        r + 1,
                        serviceDate,
                        startTime,
                        endTime,
                        recipientName.trim(),
                        certNo.trim(),
                        workerName.trim(),
                        workerDob,
                        readString(row.getCell(8)),
                        readString(row.getCell(9)),
                        readString(row.getCell(10)),
                        readString(row.getCell(11)),
                        readString(row.getCell(13)),
                        null,
                        null));
            }
            if (rows.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "등록할 일정 행이 없습니다.");
            }
            return rows;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "엑셀 파일을 읽을 수 없습니다: " + ex.getMessage());
        }
    }

    private static boolean isBlankRow(Row row) {
        for (int c = 0; c < 15; c++) {
            if (StringUtils.hasText(readString(row.getCell(c)))) {
                return false;
            }
        }
        return true;
    }

    private static String readString(Cell cell) {
        if (cell == null) {
            return null;
        }
        String value = FORMATTER.formatCellValue(cell);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.replace('\n', ' ').trim();
    }

    private static LocalDate readDate(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        String text = readString(cell);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        // yyyy-MM-dd or yyyy.MM.dd
        text = text.replace('.', '-').replace('/', '-');
        if (text.length() >= 10) {
            return LocalDate.parse(text.substring(0, 10));
        }
        return null;
    }

    private static LocalTime readTime(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            Date date = cell.getDateCellValue();
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalTime().withSecond(0).withNano(0);
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            double value = cell.getNumericCellValue();
            int totalMinutes = (int) Math.round(value * 24 * 60);
            int hour = (totalMinutes / 60) % 24;
            int minute = totalMinutes % 60;
            return LocalTime.of(hour, minute);
        }
        String text = readString(cell);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String[] parts = text.split(":");
        if (parts.length < 2) {
            return null;
        }
        return LocalTime.of(Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim()));
    }
}
