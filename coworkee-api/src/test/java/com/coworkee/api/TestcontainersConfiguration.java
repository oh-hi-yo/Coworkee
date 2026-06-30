package com.coworkee.api;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@TestConfiguration(proxyBeanMethods = false)
class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgresContainer() {
        return new PostgreSQLContainer<>(DockerImageName.parse("postgres:16"));
    }

    /**
     * Stub decoder so the Resource Server context loads without a running Keycloak.
     * Integration tests authenticate via {@code SecurityMockMvcRequestPostProcessors.jwt()},
     * which bypasses actual token decoding — this bean is never invoked, it just disables
     * the issuer-uri auto-configuration (ConditionalOnMissingBean).
     */
    @Bean
    JwtDecoder jwtDecoder() {
        return token -> {
            throw new UnsupportedOperationException("JwtDecoder is stubbed in tests");
        };
    }
}
