package com.carenmct.schedule.security;

import io.jsonwebtoken.Claims;
import org.springframework.util.StringUtils;

final class JwtClaimSupport {

    private JwtClaimSupport() {}

    static String resolveLoginId(Claims claims) {
        String loginId = claims.getSubject();
        if (!StringUtils.hasText(loginId)) {
            loginId = claims.get("userId", String.class);
        }
        if (!StringUtils.hasText(loginId)) {
            loginId = claims.get("loginId", String.class);
        }
        return loginId;
    }

    static String resolveFacilityId(Claims claims) {
        for (String key : new String[] {"facilityId", "facility_id", "facId", "orgId"}) {
            String value = claims.get(key, String.class);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
