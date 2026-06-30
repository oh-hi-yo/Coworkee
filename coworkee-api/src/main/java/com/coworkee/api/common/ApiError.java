package com.coworkee.api.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** Error body. {@code message} mirrors the legacy {@code messageProperty}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(String message, List<FieldError> errors) {

    public ApiError(String message) {
        this(message, null);
    }

    public record FieldError(String field, String message) {
    }
}
