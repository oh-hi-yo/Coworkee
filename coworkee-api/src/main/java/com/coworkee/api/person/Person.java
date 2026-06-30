package com.coworkee.api.person;

import com.coworkee.api.office.Office;
import com.coworkee.api.organization.Organization;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Person directory record. Ported from server/models/person.js.
 *
 * <p>ADR-004: the legacy {@code password} field is intentionally absent — auth
 * moved to Keycloak and Person is pure directory data.
 *
 * <p>BR-03: birthday/started/ended are calendar dates with no timezone, stored
 * as {@link LocalDate} and serialized as {@code YYYY-MM-DD} strings.
 *
 * <p>{@code picture} is stored as the relative path from the seed (e.g.
 * {@code api/portraits/men/0.jpg}); the mapper emits an absolute URL (BR / the
 * old Sequelize getter that prepended apiUrl).
 */
@Entity
@Table(name = "people")
@Getter
@Setter
@NoArgsConstructor
public class Person {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String firstname;

    @Column(nullable = false)
    private String lastname;

    private String title;

    private String phone;

    private String extension;

    private String skype;

    private String linkedin;

    private String picture;

    @Column(nullable = false)
    private LocalDate birthday;

    private LocalDate started;

    private LocalDate ended;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "office_id")
    private Office office;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;
}
