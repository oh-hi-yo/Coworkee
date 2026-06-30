package com.coworkee.api.action;

import com.coworkee.api.person.Person;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Activity-feed entry. Ported from server/models/action.js.
 * {@code subject} is precomputed from the recipient at seed time (see the
 * V2 seed generator), mirroring the legacy {@code Action.subject(type, recipient)}.
 * Used by the detail page history (BR-14, filtered by recipient).
 */
@Entity
@Table(name = "actions")
@Getter
@Setter
@NoArgsConstructor
public class Action {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String type;

    private String subject;

    @Column(nullable = false)
    private LocalDateTime created;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id")
    private Person recipient;
}
