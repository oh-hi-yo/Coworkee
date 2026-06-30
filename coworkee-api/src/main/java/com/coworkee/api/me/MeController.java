package com.coworkee.api.me;

import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /api/me — current user derived from the Keycloak JWT. */
@RestController
@RequestMapping("/api/me")
public class MeController {

    @GetMapping
    public MeDto me(JwtAuthenticationToken authentication) {
        Jwt jwt = authentication.getToken();
        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        return new MeDto(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"),
                roles);
    }

    public record MeDto(String id, String username, String email, String name, Collection<String> roles) {
    }
}
