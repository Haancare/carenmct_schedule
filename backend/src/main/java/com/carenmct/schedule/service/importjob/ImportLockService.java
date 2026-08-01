package com.carenmct.schedule.service.importjob;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** 기관·import 유형 단위 MariaDB named lock (멀티 인스턴스 동시성 제한) */
@Service
public class ImportLockService {

    private final JdbcTemplate jdbcTemplate;

    public ImportLockService(@Qualifier("scheduleDataSource") DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    public boolean tryLock(String facilityId, String importType, int timeoutSeconds) {
        String name = lockName(facilityId, importType);
        Integer result = jdbcTemplate.queryForObject(
                "SELECT GET_LOCK(?, ?)", Integer.class, name, timeoutSeconds);
        return result != null && result == 1;
    }

    public void unlock(String facilityId, String importType) {
        String name = lockName(facilityId, importType);
        jdbcTemplate.queryForObject("SELECT RELEASE_LOCK(?)", Integer.class, name);
    }

    private static String lockName(String facilityId, String importType) {
        String raw = "sch_imp_" + facilityId + "_" + importType;
        return raw.length() <= 64 ? raw : raw.substring(0, 64);
    }
}
