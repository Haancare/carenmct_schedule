package com.carenmct.schedule.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.SharedEntityManagerCreator;

@Configuration
public class QuerydslConfig {

    @Bean
    @Primary
    public JPAQueryFactory jpaQueryFactory(
            @Qualifier("scheduleEntityManagerFactory") EntityManagerFactory scheduleEmf) {
        return new JPAQueryFactory(SharedEntityManagerCreator.createSharedEntityManager(scheduleEmf));
    }

    @Bean
    public JPAQueryFactory comJpaQueryFactory(
            @Qualifier("comEntityManagerFactory") EntityManagerFactory comEmf) {
        return new JPAQueryFactory(SharedEntityManagerCreator.createSharedEntityManager(comEmf));
    }
}
