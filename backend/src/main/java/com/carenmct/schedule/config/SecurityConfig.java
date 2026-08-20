package com.carenmct.schedule.config;

import com.carenmct.schedule.security.JwtAuthenticationFilter;
import com.carenmct.schedule.security.JwtClaimSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(DevModeProperties.class)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final DevModeProperties devMode;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.requestMatchers("/error").permitAll();

                    if (devMode.permitApiWithoutAuth()) {
                        auth.requestMatchers("/api/**").permitAll();
                    } else {
                        // 관리자 API — 관리자 SSO (ROLE_ADMIN_SYSTEM) 만
                        auth.requestMatchers("/api/admin/**")
                                .hasAuthority(JwtClaimSupport.ROLE_ADMIN_SYSTEM);
                        // 기관 API — 기관 포털 JWT
                        auth.requestMatchers("/api/**").authenticated();
                    }

                    auth.anyRequest().denyAll();
                })
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
