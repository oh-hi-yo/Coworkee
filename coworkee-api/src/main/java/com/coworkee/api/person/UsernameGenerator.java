package com.coworkee.api.person;

import java.text.Normalizer;
import java.util.List;

/**
 * BR-21 — username generation, ported faithfully from
 * server/api/people.js {@code generateUsername} (including its quirks):
 *
 * <ol>
 *   <li>{@code base = latinize(first + "." + last)} then non-alphanumerics → '_', lowercased.
 *   <li>Query existing usernames {@code LIKE base%} ascending. Note '_' is a SQL LIKE
 *       wildcard, so a dotted seed username can match an underscored base.
 *   <li>If the exact base isn't the first row, it's free → return base.
 *   <li>Otherwise walk the rows replicating the original {@code .some(number != index++)}
 *       post-increment logic to pick the suffix.
 * </ol>
 *
 * The {@code .some} post-increment is preserved verbatim — do not "fix" it (a migration
 * that silently corrects legacy behavior is a failed migration).
 */
public final class UsernameGenerator {

    private UsernameGenerator() {
    }

    /** The latinized + sanitized base, without any numeric suffix. */
    public static String baseUsername(String firstname, String lastname) {
        String latinized = latinize(firstname + "." + lastname);
        return latinized.replaceAll("[^a-zA-Z0-9]", "_").toLowerCase();
    }

    /**
     * @param base existing usernames matching {@code base%}, ascending (as returned by the repo)
     */
    public static String resolve(String base, List<String> existingAscending) {
        if (existingAscending.isEmpty() || !existingAscending.get(0).equals(base)) {
            return base;
        }
        int index = 1;
        for (String name : existingAscending) {
            Integer number = parseIntLeading(name.substring(base.length()));
            boolean truthy = number != null && number != 0; // JS truthiness of a number
            if (truthy) {
                boolean stop = number != index;
                index++; // post-increment happens because `number` was truthy (&& short-circuit)
                if (stop) {
                    break;
                }
            }
        }
        return base + index;
    }

    /** Approximation of npm {@code latinize}: strip Unicode combining marks (é→e, ñ→n, ü→u). */
    static String latinize(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
    }

    /** Mirrors JS {@code parseInt} on a leading run of digits; null when there are none (NaN). */
    static Integer parseIntLeading(String s) {
        int i = 0;
        int n = s.length();
        while (i < n && Character.isWhitespace(s.charAt(i))) {
            i++;
        }
        int start = i;
        if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
            i++;
        }
        int digitsStart = i;
        while (i < n && Character.isDigit(s.charAt(i))) {
            i++;
        }
        if (i == digitsStart) {
            return null;
        }
        try {
            return Integer.parseInt(s.substring(start, i));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
