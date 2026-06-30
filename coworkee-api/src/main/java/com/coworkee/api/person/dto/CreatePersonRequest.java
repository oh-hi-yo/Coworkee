package com.coworkee.api.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Writable fields for creating a Person — the whitelist guards against
 * mass-assignment (legacy {@code writableFields}). No {@code password} (ADR-004).
 *
 * <p>BR-18 required set: firstname, lastname, username, birthday, email, phone,
 * title, started, office, organization. {@code username} keeps the legacy
 * {@code len >= 6} rule.
 */
public record CreatePersonRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, message = "Username must be at least 6 characters") String username,
        @NotBlank String firstname,
        @NotBlank String lastname,
        @NotBlank String title,
        @NotBlank String phone,
        String extension,
        String skype,
        String linkedin,
        String picture,
        @NotNull LocalDate birthday,
        @NotNull LocalDate started,
        LocalDate ended,
        @NotNull UUID officeId,
        @NotNull UUID organizationId) {
}
