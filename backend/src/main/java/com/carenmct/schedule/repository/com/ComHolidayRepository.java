package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.ComHoliday;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComHolidayRepository extends JpaRepository<ComHoliday, Long> {

    List<ComHoliday> findByHolidayDateBetweenOrderByHolidayDateAscNameAsc(
            LocalDate from, LocalDate to);

    boolean existsByHolidayDate(LocalDate holidayDate);
}
