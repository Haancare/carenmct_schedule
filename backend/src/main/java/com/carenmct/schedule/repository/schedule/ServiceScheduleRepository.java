package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceScheduleRepository
        extends JpaRepository<ServiceSchedule, Long>, ServiceScheduleRepositoryCustom {}
