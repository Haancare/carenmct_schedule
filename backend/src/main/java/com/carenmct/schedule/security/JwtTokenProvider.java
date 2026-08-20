package com.carenmct.schedule.security;

import com.carenmct.schedule.repository.com.ComUserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;
    private final ComUserRepository comUserRepository;

    public boolean validateToken(String token) {
        return validateTokenDetailed(token).valid();
    }

    public JwtValidationResult validateTokenDetailed(String token) {
        try {
            Claims claims = parseClaims(token);

            String tokenIssuer = claims.getIssuer();
            if (StringUtils.hasText(jwtProperties.getIssuer())
                    && StringUtils.hasText(tokenIssuer)
                    && !jwtProperties.getIssuer().equals(tokenIssuer)) {
                return JwtValidationResult.fail(
                        "issuer_mismatch",
                        "JWT issuer 불일치 (expected="
                                + jwtProperties.getIssuer()
                                + ", actual="
                                + tokenIssuer
                                + ")");
            }

            if (!StringUtils.hasText(JwtClaimSupport.resolveLoginId(claims))) {
                return JwtValidationResult.fail(
                        "missing_subject", "JWT 에 sub/userId/loginId 가 없습니다.");
            }

            if (JwtClaimSupport.isAdminSystem(claims)) {
                return JwtValidationResult.okAdmin(tokenIssuer);
            }

            String facilityId = JwtClaimSupport.resolveFacilityId(claims);
            if (!StringUtils.hasText(facilityId)) {
                return JwtValidationResult.fail(
                        "missing_facility_id",
                        "JWT payload 에 facilityId(또는 facility_id) claim 이 없습니다.");
            }

            return JwtValidationResult.ok(facilityId, tokenIssuer);
        } catch (SignatureException ex) {
            return JwtValidationResult.fail(
                    "invalid_signature",
                    "JWT 서명 검증 실패 — 포털과 JWT_SECRET 이 동일한지 확인하세요.");
        } catch (Exception ex) {
            return JwtValidationResult.fail("invalid_token", "JWT 파싱/검증 실패: " + ex.getMessage());
        }
    }

    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);
        String loginId = JwtClaimSupport.resolveLoginId(claims);
        JwtUserPrincipal fromClaims = JwtUserPrincipal.fromClaims(loginId, claims);

        if (fromClaims.adminSystem()) {
            return new UsernamePasswordAuthenticationToken(
                    fromClaims, token, fromClaims.getAuthorities());
        }

        String facilityId = fromClaims.facilityId();
        JwtUserPrincipal principal =
                StringUtils.hasText(facilityId)
                        ? comUserRepository
                                .findByFacilityIdAndLoginIdAndDeletedFalse(facilityId, loginId)
                                .map(user -> mergeWithDbUser(user, fromClaims))
                                .orElse(fromClaims)
                        : fromClaims;

        return new UsernamePasswordAuthenticationToken(principal, token, principal.getAuthorities());
    }

    /** SSO JWT 의 facilityId·name 을 DB 사용자보다 우선한다. */
    private static JwtUserPrincipal mergeWithDbUser(
            com.carenmct.schedule.domain.com.User user, JwtUserPrincipal fromClaims) {
        String facilityId = StringUtils.hasText(fromClaims.facilityId())
                ? fromClaims.facilityId()
                : user.getFacilityId();
        String name = StringUtils.hasText(fromClaims.name()) ? fromClaims.name() : user.getName();
        return new JwtUserPrincipal(
                user.getId(),
                user.getLoginId(),
                name,
                user.getEmail(),
                facilityId,
                false,
                fromClaims.dept(),
                fromClaims.title());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** 포털(8080) JwtTokenProvider 와 동일 — secret 은 항상 Base64 decode 후 키 생성 */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public record JwtValidationResult(
            boolean valid,
            String reasonCode,
            String message,
            String facilityId,
            String issuer,
            boolean adminSystem) {

        static JwtValidationResult ok(String facilityId, String issuer) {
            return new JwtValidationResult(true, "ok", "ok", facilityId, issuer, false);
        }

        static JwtValidationResult okAdmin(String issuer) {
            return new JwtValidationResult(true, "ok", "ok", null, issuer, true);
        }

        static JwtValidationResult fail(String reasonCode, String message) {
            return new JwtValidationResult(false, reasonCode, message, null, null, false);
        }
    }
}
