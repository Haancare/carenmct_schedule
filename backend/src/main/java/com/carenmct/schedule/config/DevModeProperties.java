package com.carenmct.schedule.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.dev")
public record DevModeProperties(boolean permitApiWithoutAuth, String defaultFacilityId) {}
