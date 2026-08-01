package com.carenmct.schedule.support;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

/** 로컬 개발용 JWT 발급 — {@code ./gradlew generateDevJwt} */
public final class DevJwtGenerator {

    private static final String DEFAULT_SECRET =
            "bXlTdXBlclNlY3JldEtleUZvckpXVEF1dGgxMjM0NTY3ODkwMTIzNDU2Nzg5MA==";
    private static final String DEFAULT_ISSUER = "carenmct-integrated";
    private static final String DEFAULT_LOGIN_ID = "devuser";
    private static final String DEFAULT_FACILITY_ID = "FAC-DEV-001";

    private DevJwtGenerator() {}

    public static void main(String[] args) {
        String secret = System.getenv().getOrDefault("JWT_SECRET", DEFAULT_SECRET);
        String issuer = System.getenv().getOrDefault("JWT_ISSUER", DEFAULT_ISSUER);
        String loginId = args.length > 0 ? args[0] : DEFAULT_LOGIN_ID;
        String facilityId = args.length > 1 ? args[1] : DEFAULT_FACILITY_ID;

        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));

        String token =
                Jwts.builder()
                        .subject(loginId)
                        .issuer(issuer)
                        .claim("name", "개발관리자")
                        .claim("email", loginId + "@carenmct.local")
                        .claim("facilityId", facilityId)
                        .signWith(key)
                        .compact();

        System.out.println("Dev JWT (loginId=" + loginId + ", facilityId=" + facilityId + "):");
        System.out.println(token);
    }
}
