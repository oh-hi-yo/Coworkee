package com.coworkee.api.person;

import com.coworkee.api.common.ApiEnvelope;
import com.coworkee.api.common.NotFoundException;
import com.coworkee.api.office.Office;
import com.coworkee.api.office.OfficeRepository;
import com.coworkee.api.organization.Organization;
import com.coworkee.api.organization.OrganizationRepository;
import com.coworkee.api.person.dto.CreatePersonRequest;
import com.coworkee.api.person.dto.FilterOptionDto;
import com.coworkee.api.person.dto.PersonDto;
import com.coworkee.api.person.dto.UpdatePersonRequest;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PersonService {

    /**
     * BR / inventory: searchable fields driving free-text search. {@code username} is
     * deliberately NOT searchable — the legacy Sequelize model only flagged these.
     */
    private static final List<String> SEARCH_FIELDS = List.of(
            "email", "firstname", "lastname", "title", "phone", "extension", "skype", "linkedin");

    private final PersonRepository personRepository;
    private final OfficeRepository officeRepository;
    private final OrganizationRepository organizationRepository;
    private final PersonMapper personMapper;

    public PersonService(
            PersonRepository personRepository,
            OfficeRepository officeRepository,
            OrganizationRepository organizationRepository,
            PersonMapper personMapper) {
        this.personRepository = personRepository;
        this.officeRepository = officeRepository;
        this.organizationRepository = organizationRepository;
        this.personMapper = personMapper;
    }

    /** BR-09/11/12: server-side paging, sorting (default lastname), filtering + search. */
    @Transactional(readOnly = true)
    public ApiEnvelope<PersonDto> list(String search, UUID officeId, UUID organizationId, Pageable pageable) {
        Specification<Person> spec = buildSpec(search, officeId, organizationId);
        Page<Person> page = personRepository.findAll(spec, pageable);
        List<PersonDto> data = page.getContent().stream().map(personMapper::toDto).toList();
        return ApiEnvelope.of(data, page.getTotalElements());
    }

    /** BR-04: resolve by id OR username OR email. */
    @Transactional(readOnly = true)
    public PersonDto getByKey(String key) {
        return personMapper.toDto(findByKey(key));
    }

    Person findByKey(String key) {
        UUID id = tryParseUuid(key);
        if (id != null) {
            var byId = personRepository.findById(id);
            if (byId.isPresent()) {
                return byId.get();
            }
        }
        return personRepository.findByUsernameOrEmail(key, key)
                .orElseThrow(() -> new NotFoundException(
                        "Unknown person with id/username/email: " + key));
    }

    @Transactional
    public PersonDto create(CreatePersonRequest req) {
        Person p = new Person();
        apply(p, req.email(), req.username(), req.firstname(), req.lastname(), req.title(),
                req.phone(), req.extension(), req.skype(), req.linkedin(), req.picture(),
                req.birthday(), req.started(), req.ended(), req.officeId(), req.organizationId());
        return personMapper.toDto(personRepository.save(p));
    }

    @Transactional
    public PersonDto update(UUID id, UpdatePersonRequest req) {
        Person p = personRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(
                        "Person with the specified id cannot be found"));
        apply(p, req.email(), req.username(), req.firstname(), req.lastname(), req.title(),
                req.phone(), req.extension(), req.skype(), req.linkedin(), req.picture(),
                req.birthday(), req.started(), req.ended(), req.officeId(), req.organizationId());
        return personMapper.toDto(personRepository.save(p));
    }

    /** BR-21. */
    @Transactional(readOnly = true)
    public String generateUsername(String firstname, String lastname) {
        String base = UsernameGenerator.baseUsername(firstname, lastname);
        List<String> existing = personRepository.findUsernamesByPrefix(base);
        return UsernameGenerator.resolve(base, existing);
    }

    /** BR-11: distinct filter options for office_id / organization_id. */
    @Transactional(readOnly = true)
    public List<FilterOptionDto> filters(String field) {
        List<PersonRepository.FilterOption> rows = switch (field) {
            case "office_id" -> personRepository.distinctOffices();
            case "organization_id" -> personRepository.distinctOrganizations();
            default -> throw new IllegalArgumentException("Unsupported filter field: " + field);
        };
        return rows.stream()
                .map(r -> new FilterOptionDto(r.getValue().toString(), r.getLabel(), r.getCount()))
                .toList();
    }

    private void apply(Person p, String email, String username, String firstname, String lastname,
            String title, String phone, String extension, String skype, String linkedin,
            String picture, java.time.LocalDate birthday, java.time.LocalDate started,
            java.time.LocalDate ended, UUID officeId, UUID organizationId) {
        p.setEmail(email);
        p.setUsername(username);
        p.setFirstname(firstname);
        p.setLastname(lastname);
        p.setTitle(title);
        p.setPhone(phone);
        p.setExtension(extension);
        p.setSkype(skype);
        p.setLinkedin(linkedin);
        p.setPicture(picture);
        p.setBirthday(birthday);
        p.setStarted(started);
        p.setEnded(ended);
        p.setOffice(loadOffice(officeId));
        p.setOrganization(loadOrganization(organizationId));
    }

    private Office loadOffice(UUID id) {
        return officeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Unknown office: " + id));
    }

    private Organization loadOrganization(UUID id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Unknown organization: " + id));
    }

    private Specification<Person> buildSpec(String search, UUID officeId, UUID organizationId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (officeId != null) {
                predicates.add(cb.equal(root.get("office").get("id"), officeId));
            }
            if (organizationId != null) {
                predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
            }
            if (StringUtils.hasText(search)) {
                String like = "%" + search.toLowerCase() + "%";
                List<Predicate> ors = new ArrayList<>();
                for (String field : SEARCH_FIELDS) {
                    ors.add(cb.like(cb.lower(root.get(field)), like));
                }
                predicates.add(cb.or(ors.toArray(new Predicate[0])));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static UUID tryParseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
