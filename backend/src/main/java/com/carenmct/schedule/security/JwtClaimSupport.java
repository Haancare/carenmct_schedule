package com.carenmct.schedule.security;

import io.jsonwebtoken.Claims;
import java.util.Collection;
import java.util.List;
import org.springframework.util.StringUtils;

public final class JwtClaimSupport {

    public static final String ROLE_ADMIN_SYSTEM = "ROLE_ADMIN_SYSTEM";

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

    /** 관리자 SSO JWT — ROLE_ADMIN_SYSTEM (기관 포털 JWT와 구분) */
    static boolean isAdminSystem(Claims claims) {
        if (hasRole(claims.get("role"), ROLE_ADMIN_SYSTEM)) {
            return true;
        }
        if (hasRole(claims.get("authority"), ROLE_ADMIN_SYSTEM)) {
            return true;
        }
        if (containsRole(claims.get("roles"), ROLE_ADMIN_SYSTEM)) {
            return true;
        }
        if (containsRole(claims.get("authorities"), ROLE_ADMIN_SYSTEM)) {
            return true;
        }
        return false;
    }

    private static boolean containsRole(Object raw, String expected) {
        if (raw == null) {
            return false;
        }
        if (raw instanceof String s) {
            return hasRole(s, expected);
        }
        if (raw instanceof Collection<?> col) {
            for (Object item : col) {
                if (hasRole(item, expected)) {
                    return true;
                }
            }
            return false;
        }
        if (raw instanceof Object[] arr) {
            for (Object item : arr) {
                if (hasRole(item, expected)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean hasRole(Object raw, String expected) {
        if (raw == null) {
            return false;
        }
        String value = String.valueOf(raw).trim();
        if (!StringUtils.hasText(value)) {
            return false;
        }
        if (expected.equals(value) || expected.equals("ROLE_" + value)) {
            return true;
        }
        // CSV: "ROLE_ADMIN_SYSTEM,ROLE_X"
        for (String part : value.split(",")) {
            String p = part.trim();
            if (expected.equals(p) || expected.equals("ROLE_" + p)) {
                return true;
            }
        }
        return false;
    }

    static String resolveDept(Claims claims) {
        String dept = claims.get("dept", String.class);
        return StringUtils.hasText(dept) ? dept : null;
    }

    static String resolveTitle(Claims claims) {
        String title = claims.get("title", String.class);
        return StringUtils.hasText(title) ? title : null;
    }
}
