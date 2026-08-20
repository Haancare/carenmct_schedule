package com.carenmct.schedule.security;

import com.carenmct.schedule.domain.com.User;
import io.jsonwebtoken.Claims;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;

public record JwtUserPrincipal(
        Long id,
        String loginId,
        String name,
        String email,
        String facilityId,
        boolean adminSystem,
        String dept,
        String title) implements UserDetails {

    private static final String NAME_CLAIM = "name";
    private static final String EMAIL_CLAIM = "email";

    public static JwtUserPrincipal from(User user) {
        return new JwtUserPrincipal(
                user.getId(),
                user.getLoginId(),
                user.getName(),
                user.getEmail(),
                user.getFacilityId(),
                false,
                null,
                null);
    }

    public static JwtUserPrincipal fromClaims(String loginId, Claims claims) {
        if (!StringUtils.hasText(loginId)) {
            loginId = JwtClaimSupport.resolveLoginId(claims);
        }
        if (!StringUtils.hasText(loginId)) {
            loginId = "unknown";
        }

        String name = claims.get(NAME_CLAIM, String.class);
        if (name == null) {
            name = loginId;
        }

        String email = claims.get(EMAIL_CLAIM, String.class);
        if (email == null) {
            email = loginId + "@external.local";
        }

        boolean adminSystem = JwtClaimSupport.isAdminSystem(claims);
        String facilityId = adminSystem ? null : JwtClaimSupport.resolveFacilityId(claims);

        return new JwtUserPrincipal(
                null,
                loginId,
                name,
                email,
                facilityId,
                adminSystem,
                JwtClaimSupport.resolveDept(claims),
                JwtClaimSupport.resolveTitle(claims));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (adminSystem) {
            return List.of(new SimpleGrantedAuthority(JwtClaimSupport.ROLE_ADMIN_SYSTEM));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override
    public String getUsername() {
        return loginId;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
