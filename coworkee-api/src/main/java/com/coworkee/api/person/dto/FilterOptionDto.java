package com.coworkee.api.person.dto;

/** BR-11: a distinct filter option ({@code value} + display {@code label} + count). */
public record FilterOptionDto(String value, String label, long count) {
}
