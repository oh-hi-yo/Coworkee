package com.coworkee.api.action;

import com.coworkee.api.action.dto.ActionDto;
import org.springframework.stereotype.Component;

@Component
public class ActionMapper {

    public ActionDto toDto(Action a) {
        return new ActionDto(a.getId(), a.getType(), a.getSubject(), a.getCreated());
    }
}
