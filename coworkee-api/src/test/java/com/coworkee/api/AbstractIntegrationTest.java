package com.coworkee.api;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base for DB-backed API tests: real schema + seed via Flyway on a Testcontainers
 * Postgres, MockMvc, and JWT authentication helpers that mirror the Keycloak realm
 * role mapping ({@code ROLE_coworkee-admin} / {@code ROLE_coworkee-viewer}).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Tag("integration")
@Transactional // each test rolls back so writes (create) don't pollute later assertions
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    protected static JwtRequestPostProcessor admin() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_coworkee-admin"))
                .jwt(j -> j.claim("preferred_username", "admin").claim("email", "admin@coworkee.test"));
    }

    protected static JwtRequestPostProcessor viewer() {
        return jwt().authorities(new SimpleGrantedAuthority("ROLE_coworkee-viewer"))
                .jwt(j -> j.claim("preferred_username", "viewer").claim("email", "viewer@coworkee.test"));
    }
}
