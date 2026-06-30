package com.coworkee.api.person.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

/** Writable fields for updating a Person (full PUT). Same whitelist/validation as create. */
public record UpdatePersonRequest(
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
