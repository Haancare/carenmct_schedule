package com.carenmct.schedule.config.persistence;

import jakarta.persistence.EntityManagerFactory;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "com.carenmct.schedule.repository",
        excludeFilters =
                @org.springframework.context.annotation.ComponentScan.Filter(
                        type = org.springframework.context.annotation.FilterType.REGEX,
                        pattern = "com\\.carenmct\\.schedule\\.repository\\.com\\..*"),
        entityManagerFactoryRef = "scheduleEntityManagerFactory",
        transactionManagerRef = "scheduleTransactionManager")
public class ScheduleJpaConfig {

    @Primary
    @Bean
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties scheduleDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Primary
    @Bean(name = "scheduleDataSource")
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource scheduleDataSource(
            @Qualifier("scheduleDataSourceProperties") DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }

    @Primary
    @Bean(name = "scheduleEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean scheduleEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("scheduleDataSource") DataSource dataSource) {

        Map<String, Object> jpaProperties = new HashMap<>();
        jpaProperties.put("hibernate.hbm2ddl.auto", "none");

        return builder.dataSource(dataSource)
                .packages("com.carenmct.schedule.domain.schedule")
                .persistenceUnit("carenmctSchedule")
                .properties(jpaProperties)
                .build();
    }

    @Primary
    @Bean(name = "scheduleTransactionManager")
    public PlatformTransactionManager scheduleTransactionManager(
            @Qualifier("scheduleEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
