package com.coworkee.api.organization.dto;

import com.coworkee.api.person.dto.PersonRefDto;
import java.util.UUID;

public record OrganizationDto(UUID id, String name, PersonRefDto manager) {
}
