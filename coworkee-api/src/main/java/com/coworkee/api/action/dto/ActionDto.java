package com.coworkee.api.action.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ActionDto(UUID id, String type, String subject, LocalDateTime created) {
}
