package com.coworkee.api.organization.dto;

import java.util.UUID;

/** Lightweight organization reference embedded in Person (no manager, no cycle). */
public record OrganizationRefDto(UUID id, String name) {
}
