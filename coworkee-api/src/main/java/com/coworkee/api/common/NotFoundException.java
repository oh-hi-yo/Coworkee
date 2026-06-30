package com.coworkee.api.common;

/** Maps to HTTP 404 with a {@code { message }} body (legacy messageProperty). */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
