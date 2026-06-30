package com.coworkee.api.organization;

import com.coworkee.api.common.ApiEnvelope;
import com.coworkee.api.organization.dto.OrganizationDto;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMapper organizationMapper;

    public OrganizationController(
            OrganizationRepository organizationRepository,
            OrganizationMapper organizationMapper) {
        this.organizationRepository = organizationRepository;
        this.organizationMapper = organizationMapper;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ApiEnvelope<OrganizationDto> list() {
        List<OrganizationDto> data = organizationRepository.findAll(Sort.by("name")).stream()
                .map(organizationMapper::toDto)
                .toList();
        return ApiEnvelope.of(data, data.size());
    }
}
