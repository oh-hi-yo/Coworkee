package com.coworkee.api.office.dto;

import java.util.UUID;

/** Lightweight office reference embedded in Person (no cycle). */
public record OfficeRefDto(UUID id, String name, String city, String country) {
}
