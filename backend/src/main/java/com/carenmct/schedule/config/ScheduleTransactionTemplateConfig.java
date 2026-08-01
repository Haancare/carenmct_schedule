package com.carenmct.schedule.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class ScheduleTransactionTemplateConfig {

    @Bean(name = "scheduleTransactionTemplate")
    public TransactionTemplate scheduleTransactionTemplate(
            @Qualifier("scheduleTransactionManager") PlatformTransactionManager transactionManager) {
        return new TransactionTemplate(transactionManager);
    }
}
