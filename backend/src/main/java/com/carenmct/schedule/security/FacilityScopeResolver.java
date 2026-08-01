package com.carenmct.schedule.security;

import com.carenmct.schedule.config.DevModeProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

/**
 * 기관(facility) 스코프 — JWT 가 있으면 토큰의 facilityId 우선.
 * dev fallback(DEV_FACILITY_ID)은 Authorization 헤더가 없을 때만 사용한다.
 */
@Component
@RequiredArgsConstructor
public class FacilityScopeResolver {

    private static final String BEARER_PREFIX = "Bearer ";

    private final DevModeProperties devMode;
    private final JwtTokenProvider jwtTokenProvider;

    public String requireFacilityId() {
        String facilityId = FacilityScope.currentFacilityId();
        if (StringUtils.hasText(facilityId)) {
            return facilityId;
        }

        String bearerToken = resolveBearerToken();
        if (StringUtils.hasText(bearerToken)) {
            JwtTokenProvider.JwtValidationResult validation =
                    jwtTokenProvider.validateTokenDetailed(bearerToken);
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    validation.valid()
                            ? "JWT 에 facilityId 가 없습니다. 포털에서 다시 로그인해 주세요."
                            : validation.message());
        }

        if (devMode.permitApiWithoutAuth() && StringUtils.hasText(devMode.defaultFacilityId())) {
            return devMode.defaultFacilityId();
        }

        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "facilityId 를 확인할 수 없습니다. 통합관리 포털에서 다시 이동해 주세요.");
    }

    private static String resolveBearerToken() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (!StringUtils.hasText(authorization) || !authorization.startsWith(BEARER_PREFIX)) {
            return null;
        }
        return authorization.substring(BEARER_PREFIX.length());
    }

    private static HttpServletRequest currentRequest() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        return attrs.getRequest();
    }
}
