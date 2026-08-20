package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.admin.AnnualFeeRateServiceDto;
import com.carenmct.schedule.dto.admin.AnnualFeeRateYearDto;
import com.carenmct.schedule.dto.admin.UpsertAnnualFeeRateServiceRequest;
import com.carenmct.schedule.service.AdminAnnualFeeRateService;
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
@RequestMapping("/api/admin/annual-fee-rates")
@RequiredArgsConstructor
public class AdminAnnualFeeRateController {

    private final AdminAnnualFeeRateService adminAnnualFeeRateService;

    @GetMapping
    public List<Integer> listYears() {
        return adminAnnualFeeRateService.listYears();
    }

    @GetMapping("/{year}")
    public AnnualFeeRateYearDto getYear(@PathVariable int year) {
        return adminAnnualFeeRateService.getYear(year);
    }

    @PutMapping("/{year}/{serviceType}")
    public AnnualFeeRateServiceDto upsertService(
            @PathVariable int year,
            @PathVariable String serviceType,
            @Valid @RequestBody UpsertAnnualFeeRateServiceRequest request) {
        return adminAnnualFeeRateService.upsertService(year, serviceType, request);
    }

    @PostMapping("/next-year")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnualFeeRateYearDto createNextYear() {
        return adminAnnualFeeRateService.createNextYear();
    }
}
