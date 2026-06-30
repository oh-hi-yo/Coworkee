package com.coworkee.api.action;

import com.coworkee.api.action.dto.ActionDto;
import com.coworkee.api.common.ApiEnvelope;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/actions")
public class ActionController {

    private final ActionRepository actionRepository;
    private final ActionMapper actionMapper;

    public ActionController(ActionRepository actionRepository, ActionMapper actionMapper) {
        this.actionRepository = actionRepository;
        this.actionMapper = actionMapper;
    }

    /** BR-14: a person's activity history. */
    @GetMapping
    public ApiEnvelope<ActionDto> list(@RequestParam(name = "recipient_id") UUID recipientId) {
        List<ActionDto> data = actionRepository
                .findByRecipientIdOrderByCreatedDesc(recipientId).stream()
                .map(actionMapper::toDto)
                .toList();
        return ApiEnvelope.of(data, data.size());
    }
}
