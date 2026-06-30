package com.coworkee.api.office;

import com.coworkee.api.office.dto.LocationDto;
import com.coworkee.api.office.dto.OfficeDto;
import org.springframework.stereotype.Component;

@Component
public class OfficeMapper {

    public OfficeDto toDto(Office o) {
        return new OfficeDto(
                o.getId(),
                o.getName(),
                o.getAddress(),
                o.getPostcode(),
                o.getRegion(),
                o.getCity(),
                o.getCountry(),
                new LocationDto(o.getLatitude(), o.getLongitude()));
    }
}
