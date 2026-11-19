package com.learnflow.backend.common.config;

import com.learnflow.backend.auth.JwtAuthenticationFilter;
import com.learnflow.backend.auth.LoginRateLimitFilter;
import com.learnflow.backend.common.web.ApiPaths;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless JWT auth: register, login, refresh, logout, health and the licence page are public;
 * everything else requires a valid Bearer access token.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ObjectProvider<LoginRateLimitFilter> loginRateLimitFilter)
            throws Exception {
        http.csrf(csrf -> csrf.disable())
                .sessionManagement(
                        session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth ->
                        auth.requestMatchers(
                                        ApiPaths.V1.Auth.BASE + ApiPaths.V1.Auth.REGISTER,
                                        ApiPaths.V1.Auth.BASE + ApiPaths.V1.Auth.LOGIN,
                                        // Authenticated by the refresh cookie, not a Bearer token.
                                        ApiPaths.V1.Auth.BASE + ApiPaths.V1.Auth.REFRESH,
                                        ApiPaths.V1.Auth.BASE + ApiPaths.V1.Auth.LOGOUT,
                                        ApiPaths.V1.Health.BASE,
                                        ApiPaths.V1.Curriculum.BASE
                                                + ApiPaths.V1.Curriculum.SOURCES)
                                .permitAll()
                                .anyRequest()
                                .authenticated())
                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(
                        jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        loginRateLimitFilter.ifAvailable(
                filter -> http.addFilterBefore(filter, UsernamePasswordAuthenticationFilter.class));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
