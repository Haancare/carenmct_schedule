package com.carenmct.schedule.service.importclaim;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.springframework.util.StringUtils;

final class ExcelCellReaders {

    private static final DataFormatter FORMATTER = new DataFormatter();

    private ExcelCellReaders() {}

    static String readString(Cell cell) {
        if (cell == null) {
            return null;
        }
        String value = FORMATTER.formatCellValue(cell);
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.replace('\n', ' ').trim();
    }

    static LocalDate readDate(Cell cell) {
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
        text = text.replace('.', '-').replace('/', '-');
        if (text.length() >= 10) {
            return LocalDate.parse(text.substring(0, 10));
        }
        return null;
    }

    static LocalTime readTime(Cell cell) {
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

    static Integer readInteger(Cell cell) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) Math.round(cell.getNumericCellValue());
        }
        String text = readString(cell);
        if (!StringUtils.hasText(text)) {
            return null;
        }
        String digits = text.replace(",", "").replace("원", "").trim();
        if (!StringUtils.hasText(digits)) {
            return null;
        }
        return Integer.parseInt(digits);
    }

    static boolean isBlankRow(org.apache.poi.ss.usermodel.Row row, int maxCols) {
        for (int c = 0; c < maxCols; c++) {
            if (StringUtils.hasText(readString(row.getCell(c)))) {
                return false;
            }
        }
        return true;
    }
}
