package com.coworkee.api.person;

import com.coworkee.api.common.ApiEnvelope;
import com.coworkee.api.person.dto.CreatePersonRequest;
import com.coworkee.api.person.dto.FilterOptionDto;
import com.coworkee.api.person.dto.PersonDto;
import com.coworkee.api.person.dto.UpdatePersonRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/people")
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    /** BR-09/11/12. Default sort lastname asc. */
    @GetMapping
    public ApiEnvelope<PersonDto> list(
            @RequestParam(required = false) String search,
            @RequestParam(name = "office_id", required = false) UUID officeId,
            @RequestParam(name = "organization_id", required = false) UUID organizationId,
            @PageableDefault(size = 25, sort = "lastname") Pageable pageable) {
        return personService.list(search, officeId, organizationId, pageable);
    }

    /** BR-11. {@code label} kept for legacy compatibility; the label column is fixed to the name. */
    @GetMapping("/filters")
    public ApiEnvelope<FilterOptionDto> filters(
            @RequestParam String field,
            @RequestParam(required = false) String label) {
        List<FilterOptionDto> data = personService.filters(field);
        return ApiEnvelope.of(data, data.size());
    }

    /** BR-21. */
    @GetMapping("/generate-username")
    public GenerateUsernameResponse generateUsername(
            @RequestParam String firstname,
            @RequestParam String lastname) {
        return new GenerateUsernameResponse(personService.generateUsername(firstname, lastname));
    }

    /** BR-04: id ∨ username ∨ email. */
    @GetMapping("/{key}")
    public PersonDto get(@PathVariable String key) {
        return personService.getByKey(key);
    }

    @PostMapping
    @PreAuthorize("hasRole('coworkee-admin')")
    public ResponseEntity<PersonDto> create(@Valid @RequestBody CreatePersonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(personService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('coworkee-admin')")
    public PersonDto update(@PathVariable UUID id, @Valid @RequestBody UpdatePersonRequest request) {
        return personService.update(id, request);
    }

    public record GenerateUsernameResponse(String username) {
    }
}
