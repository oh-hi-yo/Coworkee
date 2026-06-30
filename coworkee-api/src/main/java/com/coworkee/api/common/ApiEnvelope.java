package com.coworkee.api.common;

import java.util.List;

/**
 * Legacy Ext.Direct response envelope {@code { data, total }} (ADR-002).
 * Preserved on the wire so the web anti-corruption layer can unwrap it.
 */
public record ApiEnvelope<T>(List<T> data, long total) {

    public static <T> ApiEnvelope<T> of(List<T> data, long total) {
        return new ApiEnvelope<>(data, total);
    }
}
