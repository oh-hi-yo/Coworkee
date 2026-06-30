package com.coworkee.api.person;

import com.coworkee.api.office.Office;
import com.coworkee.api.office.dto.OfficeRefDto;
import com.coworkee.api.organization.Organization;
import com.coworkee.api.organization.dto.OrganizationRefDto;
import com.coworkee.api.person.dto.PersonDto;
import com.coworkee.api.person.dto.PersonRefDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Person entity → DTO mapping. Centralizes the "magic":
 * BR-01 {@code url}, BR-02 {@code fullname}, and the absolute {@code picture} URL
 * (legacy Sequelize getter prepended apiUrl).
 */
@Component
public class PersonMapper {

    private final String portraitsBaseUrl;

    public PersonMapper(@Value("${app.portraits.base-url:http://localhost:8080}") String portraitsBaseUrl) {
        // strip a trailing slash so we can join with exactly one
        this.portraitsBaseUrl = portraitsBaseUrl.endsWith("/")
                ? portraitsBaseUrl.substring(0, portraitsBaseUrl.length() - 1)
                : portraitsBaseUrl;
    }

    public PersonDto toDto(Person p) {
        return new PersonDto(
                p.getId(),
                p.getEmail(),
                p.getUsername(),
                p.getFirstname(),
                p.getLastname(),
                fullName(p),
                p.getTitle(),
                p.getPhone(),
                p.getExtension(),
                p.getSkype(),
                p.getLinkedin(),
                pictureUrl(p.getPicture()),
                p.getBirthday(),
                p.getStarted(),
                p.getEnded(),
                officeRef(p.getOffice()),
                organizationRef(p.getOrganization()),
                personPath(p));
    }

    public PersonRefDto toRef(Person p) {
        if (p == null) {
            return null;
        }
        return new PersonRefDto(
                p.getId(),
                p.getFirstname(),
                p.getLastname(),
                fullName(p),
                p.getTitle(),
                pictureUrl(p.getPicture()));
    }

    /** BR-02. */
    public static String fullName(Person p) {
        return p.getFirstname() + " " + p.getLastname();
    }

    /** BR-01: {@code person/{id}}. */
    public static String personPath(Person p) {
        return "person/" + p.getId();
    }

    public String pictureUrl(String relative) {
        if (!StringUtils.hasText(relative)) {
            return null;
        }
        if (relative.startsWith("http://") || relative.startsWith("https://")) {
            return relative;
        }
        String tail = relative.startsWith("/") ? relative.substring(1) : relative;
        return portraitsBaseUrl + "/" + tail;
    }

    private OfficeRefDto officeRef(Office o) {
        if (o == null) {
            return null;
        }
        return new OfficeRefDto(o.getId(), o.getName(), o.getCity(), o.getCountry());
    }

    private OrganizationRefDto organizationRef(Organization org) {
        if (org == null) {
            return null;
        }
        return new OrganizationRefDto(org.getId(), org.getName());
    }
}
