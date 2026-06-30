package com.coworkee.api.person.dto;

import com.coworkee.api.office.dto.OfficeRefDto;
import com.coworkee.api.organization.dto.OrganizationRefDto;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Full person representation for list + detail.
 *
 * <ul>
 *   <li>{@code fullname} — BR-02 ({@code firstname + ' ' + lastname}).
 *   <li>{@code url} — BR-01 ({@code "person/{id}"}).
 *   <li>{@code picture} — absolute URL (BR / legacy Sequelize getter).
 *   <li>birthday/started/ended — {@link LocalDate}, serialized {@code YYYY-MM-DD} (BR-03).
 *   <li>no {@code password} — ADR-004.
 * </ul>
 */
public record PersonDto(
        UUID id,
        String email,
        String username,
        String firstname,
        String lastname,
        String fullname,
        String title,
        String phone,
        String extension,
        String skype,
        String linkedin,
        String picture,
        LocalDate birthday,
        LocalDate started,
        LocalDate ended,
        OfficeRefDto office,
        OrganizationRefDto organization,
        String url) {
}
