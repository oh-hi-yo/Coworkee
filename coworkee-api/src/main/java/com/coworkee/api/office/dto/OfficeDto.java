package com.coworkee.api.office.dto;

import java.util.UUID;

public record OfficeDto(
        UUID id,
        String name,
        String address,
        String postcode,
        String region,
        String city,
        String country,
        LocationDto location) {
}
