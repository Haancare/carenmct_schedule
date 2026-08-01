package com.carenmct.schedule.config.persistence;

import com.carenmct.schedule.domain.com.ComDatabaseCatalog;
import jakarta.persistence.EntityManagerFactory;
import java.util.HashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableTransactionManagement
@EnableConfigurationProperties(ComDataSourceProperties.class)
@EnableJpaRepositories(
        basePackages = "com.carenmct.schedule.repository.com",
        entityManagerFactoryRef = "comEntityManagerFactory",
        transactionManagerRef = "comTransactionManager")
public class ComJpaConfig {

    @Bean(name = "comDataSource")
    public DataSource comDataSource(ComDataSourceProperties properties) {
        org.springframework.boot.jdbc.DataSourceBuilder<?> builder =
                org.springframework.boot.jdbc.DataSourceBuilder.create();
        builder.url(properties.getJdbcUrl());
        builder.username(properties.getUsername());
        builder.password(properties.getPassword());
        builder.driverClassName(properties.getDriverClassName());
        return builder.build();
    }

    @Bean(name = "comEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean comEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("comDataSource") DataSource dataSource) {

        Map<String, Object> jpaProperties = new HashMap<>();
        jpaProperties.put("hibernate.hbm2ddl.auto", "none");
        jpaProperties.put("hibernate.default_catalog", ComDatabaseCatalog.NAME);

        return builder.dataSource(dataSource)
                .packages("com.carenmct.schedule.domain.com")
                .persistenceUnit("carenmctCom")
                .properties(jpaProperties)
                .build();
    }

    @Bean(name = "comTransactionManager")
    public PlatformTransactionManager comTransactionManager(
            @Qualifier("comEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}
