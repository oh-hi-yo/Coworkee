package com.coworkee.api.person;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * BR-21 characterization tests — pin the legacy generateUsername behavior, including
 * its quirks (the {@code .some(number != index++)} post-increment and the underscore
 * base matching dotted seed usernames via the LIKE wildcard).
 */
class UsernameGeneratorTest {

    @Test
    void base_lowercases_and_replaces_nonalphanumerics_with_underscore() {
        assertThat(UsernameGenerator.baseUsername("Benjamin", "Banks")).isEqualTo("benjamin_banks");
        assertThat(UsernameGenerator.baseUsername("Mary Jane", "O'Neil")).isEqualTo("mary_jane_o_neil");
    }

    @Test
    void base_latinizes_accents() {
        assertThat(UsernameGenerator.baseUsername("Renée", "Dupont")).isEqualTo("renee_dupont");
        assertThat(UsernameGenerator.baseUsername("Søren", "Müller")).isEqualTo("s_ren_muller");
    }

    @Test
    void free_base_returned_as_is() {
        assertThat(UsernameGenerator.resolve("john_doe", List.of())).isEqualTo("john_doe");
    }

    @Test
    void base_taken_only_via_wildcard_match_is_still_free() {
        // legacy: underscore base matches dotted seed username through the LIKE wildcard,
        // but since the exact base is not the first row, base is returned unchanged.
        assertThat(UsernameGenerator.resolve("john_doe", List.of("john.doe"))).isEqualTo("john_doe");
    }

    @Test
    void base_taken_no_suffix_yields_one() {
        assertThat(UsernameGenerator.resolve("john_doe", List.of("john_doe"))).isEqualTo("john_doe1");
    }

    @Test
    void contiguous_suffixes_yield_next_free() {
        assertThat(UsernameGenerator.resolve("john_doe",
                List.of("john_doe", "john_doe1", "john_doe2"))).isEqualTo("john_doe3");
    }

    @Test
    void gap_reproduces_legacy_off_by_one_quirk() {
        // [base, base1, base3] — the smallest truly-free suffix is 2, but the legacy
        // post-increment returns 3. We replicate it verbatim (do not "fix").
        assertThat(UsernameGenerator.resolve("john_doe",
                List.of("john_doe", "john_doe1", "john_doe3"))).isEqualTo("john_doe3");
    }

    @Test
    void parseIntLeading_matches_js_parseInt_semantics() {
        assertThat(UsernameGenerator.parseIntLeading("")).isNull();
        assertThat(UsernameGenerator.parseIntLeading("abc")).isNull();
        assertThat(UsernameGenerator.parseIntLeading("12")).isEqualTo(12);
        assertThat(UsernameGenerator.parseIntLeading("3x")).isEqualTo(3);
    }
}
