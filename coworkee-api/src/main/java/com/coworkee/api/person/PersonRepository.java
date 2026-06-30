package com.coworkee.api.person;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PersonRepository
        extends JpaRepository<Person, UUID>, JpaSpecificationExecutor<Person> {

    /** BR-04: resolve a person by username or email (id handled separately in the service). */
    Optional<Person> findByUsernameOrEmail(String username, String email);

    /**
     * BR-21: usernames matching {@code prefix%}, ascending. The prefix may contain
     * underscores, which remain SQL LIKE single-char wildcards — this intentionally
     * preserves the legacy quirk where {@code generateUsername} replaced '.' with '_'
     * yet still matched dotted seed usernames.
     */
    @Query("select p.username from Person p where p.username like concat(:prefix, '%') order by p.username asc")
    List<String> findUsernamesByPrefix(@Param("prefix") String prefix);

    /** BR-11: distinct values + label for a filterable foreign key (office/organization). */
    @Query("select o.id as value, o.name as label, count(p.id) as count "
            + "from Person p join p.office o group by o.id, o.name order by o.name asc")
    List<FilterOption> distinctOffices();

    @Query("select org.id as value, org.name as label, count(p.id) as count "
            + "from Person p join p.organization org group by org.id, org.name order by org.name asc")
    List<FilterOption> distinctOrganizations();

    /** Projection for filter aggregation (BR-11). */
    interface FilterOption {
        UUID getValue();

        String getLabel();

        long getCount();
    }
}
