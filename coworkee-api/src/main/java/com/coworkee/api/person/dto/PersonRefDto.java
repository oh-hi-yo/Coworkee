package com.coworkee.api.person.dto;

import java.util.UUID;

/** Lightweight person reference (e.g. an organization's manager). */
public record PersonRefDto(
        UUID id,
        String firstname,
        String lastname,
        String fullname,
        String title,
        String picture) {
}
