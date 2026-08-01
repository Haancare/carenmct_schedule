package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.ComHoliday;
import com.carenmct.schedule.dto.holiday.HolidayDto;
import com.carenmct.schedule.repository.com.ComHolidayRepository;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "comTransactionManager")
public class HolidayService {

    private final ComHolidayRepository comHolidayRepository;

    public boolean isHoliday(LocalDate date) {
        return comHolidayRepository.existsByHolidayDate(date);
    }

    /** 요청 단위 캐시용 — 연도 공휴일 일자를 한 번에 로드 */
    public Set<LocalDate> holidayDatesForYear(int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);
        return comHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAscNameAsc(from, to).stream()
                .map(ComHoliday::getHolidayDate)
                .collect(Collectors.toCollection(HashSet::new));
    }

    public boolean isHoliday(LocalDate date, Set<LocalDate> preloadedDates) {
        if (preloadedDates != null) {
            return preloadedDates.contains(date);
        }
        return isHoliday(date);
    }

    public List<HolidayDto> getHolidaysForYear(int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);
        return comHolidayRepository.findByHolidayDateBetweenOrderByHolidayDateAscNameAsc(from, to).stream()
                .map(this::toDto)
                .toList();
    }

    private HolidayDto toDto(ComHoliday holiday) {
        return new HolidayDto(
                holiday.getHolidayDate().toString(),
                holiday.getName(),
                holiday.getType());
    }
}
