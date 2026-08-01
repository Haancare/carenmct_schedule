package com.carenmct.schedule.service;

import com.carenmct.schedule.dto.paymentassignment.WeeklyCalendarWeekDto;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 프론트 {@code buildWeeksFromDates} 와 동일 규칙 */
final class WeeklyCalendarBuilder {

    private WeeklyCalendarBuilder() {}

    static List<WeeklyCalendarWeekDto> buildWeeksFromDates(List<String> dates) {
        if (dates == null || dates.isEmpty()) {
            return List.of();
        }

        List<String> sorted = dates.stream().sorted().toList();
        LocalDate start = mondayOf(LocalDate.parse(sorted.get(0)));
        LocalDate lastMon = mondayOf(LocalDate.parse(sorted.get(sorted.size() - 1)));
        LocalDate end = lastMon.plusDays(6);

        List<WeekBlock> rawWeeks = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            List<LocalDate> days = new ArrayList<>();
            for (int i = 0; i < 7; i++) {
                days.add(cur.plusDays(i));
            }
            rawWeeks.add(new WeekBlock(days.get(0), days));
            cur = cur.plusDays(7);
        }

        return rawWeeks.stream().map(WeeklyCalendarBuilder::toWeekDto).toList();
    }

    private static WeeklyCalendarWeekDto toWeekDto(WeekBlock block) {
        Map<String, Integer> counts = new HashMap<>();
        for (LocalDate day : block.days) {
            String key = day.getYear() + "-" + day.getMonthValue();
            counts.merge(key, 1, Integer::sum);
        }

        String bestKey = counts.entrySet().stream()
                .max(Comparator.comparingInt(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse("");

        String[] parts = bestKey.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        LocalDate w1 = firstWeekMonday(year, month - 1);
        LocalDate thisMon = mondayOf(block.monday);
        long ord = ChronoUnit.WEEKS.between(w1, thisMon) + 1;

        List<String> dayStrings = block.days.stream().map(LocalDate::toString).toList();
        return new WeeklyCalendarWeekDto(dayStrings, month + "월 " + ord + "주차");
    }

    private static LocalDate mondayOf(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private static LocalDate firstWeekMonday(int year, int monthZeroBased) {
        LocalDate firstOfMonth = LocalDate.of(year, monthZeroBased + 1, 1);
        LocalDate monF = mondayOf(firstOfMonth);

        int count = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate dd = monF.plusDays(i);
            if (dd.getYear() == year && dd.getMonthValue() == monthZeroBased + 1) {
                count++;
            }
        }

        if (count >= 4) {
            return monF;
        }
        return monF.plusDays(7);
    }

    private record WeekBlock(LocalDate monday, List<LocalDate> days) {}
}
