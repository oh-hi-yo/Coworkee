package com.coworkee.api.organization;

import com.coworkee.api.organization.dto.OrganizationDto;
import com.coworkee.api.person.PersonMapper;
import org.springframework.stereotype.Component;

@Component
public class OrganizationMapper {

    private final PersonMapper personMapper;

    public OrganizationMapper(PersonMapper personMapper) {
        this.personMapper = personMapper;
    }

    public OrganizationDto toDto(Organization org) {
        return new OrganizationDto(
                org.getId(),
                org.getName(),
                personMapper.toRef(org.getManager()));
    }
}
