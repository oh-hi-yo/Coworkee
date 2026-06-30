package com.coworkee.api.action;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActionRepository extends JpaRepository<Action, UUID> {

    /** BR-14: a person's activity history, newest first. */
    List<Action> findByRecipientIdOrderByCreatedDesc(UUID recipientId);
}
