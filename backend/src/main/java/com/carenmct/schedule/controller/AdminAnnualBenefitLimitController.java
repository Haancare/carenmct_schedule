package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.admin.AnnualBenefitLimitDto;
import com.carenmct.schedule.dto.admin.UpsertAnnualBenefitLimitRequest;
import com.carenmct.schedule.service.AdminAnnualBenefitLimitService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/annual-benefit-limits")
@RequiredArgsConstructor
public class AdminAnnualBenefitLimitController {

    private final AdminAnnualBenefitLimitService adminAnnualBenefitLimitService;

    @GetMapping
    public List<AnnualBenefitLimitDto> list() {
        return adminAnnualBenefitLimitService.list();
    }

    @GetMapping("/{year}")
    public AnnualBenefitLimitDto get(@PathVariable int year) {
        return adminAnnualBenefitLimitService.get(year);
    }

    @PutMapping("/{year}")
    public AnnualBenefitLimitDto upsert(
            @PathVariable int year, @Valid @RequestBody UpsertAnnualBenefitLimitRequest request) {
        return adminAnnualBenefitLimitService.upsert(year, request);
    }

    @PostMapping("/next-year")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnualBenefitLimitDto createNextYear() {
        return adminAnnualBenefitLimitService.createNextYear();
    }
}
