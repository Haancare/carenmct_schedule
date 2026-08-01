package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.session.CurrentFacilityDto;
import com.carenmct.schedule.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/current-facility")
    public CurrentFacilityDto getCurrentFacility() {
        return sessionService.getCurrentFacility();
    }
}
