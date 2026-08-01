package com.carenmct.schedule.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

/** JWT 인증 컨텍스트에서 기관(facility) ID 를 조회합니다. */
public final class FacilityScope {

    private FacilityScope() {}

    public static String requireFacilityId() {
        String facilityId = currentFacilityId();
        if (!StringUtils.hasText(facilityId)) {
            throw new IllegalStateException("인증된 기관(facilityId) 컨텍스트가 없습니다.");
        }
        return facilityId;
    }

    public static String currentFacilityId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof JwtUserPrincipal jwtUser) {
            return jwtUser.facilityId();
        }

        return null;
    }
}
