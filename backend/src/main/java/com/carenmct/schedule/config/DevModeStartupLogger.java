package com.carenmct.schedule.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class DevModeStartupLogger {

    private final DevModeProperties devMode;

    @EventListener(ApplicationReadyEvent.class)
    public void logDevMode() {
        if (!devMode.permitApiWithoutAuth()) {
            return;
        }

        log.warn("=== DEV MODE: /api/** JWT 인증 생략 (프로덕션 배포 시 spring.profiles.active=prod) ===");
        if (StringUtils.hasText(devMode.defaultFacilityId())) {
            log.warn("DEV default facilityId: {}", devMode.defaultFacilityId());
        } else {
            log.warn("DEV default facilityId 미설정 — API 호출 시 DEV_FACILITY_ID 환경변수 또는 app.dev.default-facility-id 필요");
        }
    }
}
