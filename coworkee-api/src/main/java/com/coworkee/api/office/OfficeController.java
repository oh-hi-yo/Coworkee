package com.coworkee.api.office;

import com.coworkee.api.common.ApiEnvelope;
import com.coworkee.api.office.dto.OfficeDto;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/offices")
public class OfficeController {

    private final OfficeRepository officeRepository;
    private final OfficeMapper officeMapper;

    public OfficeController(OfficeRepository officeRepository, OfficeMapper officeMapper) {
        this.officeRepository = officeRepository;
        this.officeMapper = officeMapper;
    }

    @GetMapping
    public ApiEnvelope<OfficeDto> list() {
        List<OfficeDto> data = officeRepository.findAll(Sort.by("name")).stream()
                .map(officeMapper::toDto)
                .toList();
        return ApiEnvelope.of(data, data.size());
    }
}
