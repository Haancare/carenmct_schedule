package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.copayconfirmation.AddNonBenefitCategoryRequest;
import com.carenmct.schedule.dto.copayconfirmation.ApplyRecipientConfirmRequest;
import com.carenmct.schedule.dto.copayconfirmation.BulkCancelRequest;
import com.carenmct.schedule.dto.copayconfirmation.BulkConfirmRequest;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationListQuery;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationMutationResponse;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationRowsResponse;
import com.carenmct.schedule.dto.copayconfirmation.CopayMonthSummaryResponse;
import com.carenmct.schedule.dto.copayconfirmation.NonBenefitBulkResponse;
import com.carenmct.schedule.dto.copayconfirmation.NonBenefitCategoriesResponse;
import com.carenmct.schedule.dto.copayconfirmation.SaveNonBenefitBulkRequest;
import com.carenmct.schedule.service.CopayConfirmationCommandService;
import com.carenmct.schedule.service.CopayConfirmationQueryService;
import com.carenmct.schedule.service.CopayNonBenefitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/copayment-confirmation")
@RequiredArgsConstructor
public class CopayConfirmationController {

    private final CopayConfirmationQueryService copayConfirmationQueryService;
    private final CopayConfirmationCommandService copayConfirmationCommandService;
    private final CopayNonBenefitService copayNonBenefitService;

    @GetMapping("/month-summary")
    public CopayMonthSummaryResponse getMonthSummary(@RequestParam int year) {
        return copayConfirmationQueryService.getMonthSummary(year);
    }

    @GetMapping("/rows")
    public CopayConfirmationRowsResponse getRows(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String serviceType) {

        CopayConfirmationListQuery listQuery = new CopayConfirmationListQuery(
                year,
                month,
                query,
                CopayConfirmationListQuery.parseStatus(status),
                CopayConfirmationListQuery.parseServiceType(serviceType));

        return copayConfirmationQueryService.getRows(listQuery);
    }

    @PutMapping("/recipients/{recipientId}")
    public CopayConfirmationMutationResponse applyRecipientConfirm(
            @PathVariable String recipientId, @RequestBody ApplyRecipientConfirmRequest request) {
        return copayConfirmationCommandService.applyRecipientConfirm(recipientId, request);
    }

    @PostMapping("/bulk-confirm")
    public CopayConfirmationMutationResponse bulkConfirm(@RequestBody BulkConfirmRequest request) {
        return copayConfirmationCommandService.bulkConfirm(request);
    }

    @PostMapping("/bulk-cancel")
    public CopayConfirmationMutationResponse bulkCancel(@RequestBody BulkCancelRequest request) {
        return copayConfirmationCommandService.bulkCancel(request);
    }

    @GetMapping("/non-benefit")
    public NonBenefitBulkResponse getNonBenefit(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String serviceType,
            @RequestParam(required = false) String recipientId) {
        return copayNonBenefitService.getBulk(year, month, query, status, serviceType, recipientId);
    }

    @PutMapping("/non-benefit")
    public CopayConfirmationMutationResponse saveNonBenefit(@RequestBody SaveNonBenefitBulkRequest request) {
        return copayNonBenefitService.saveBulk(request);
    }

    @GetMapping("/non-benefit/categories")
    public NonBenefitCategoriesResponse getNonBenefitCategories() {
        return copayNonBenefitService.getCategories();
    }

    @PostMapping("/non-benefit/categories")
    public NonBenefitCategoriesResponse addNonBenefitCategory(@RequestBody AddNonBenefitCategoryRequest request) {
        return copayNonBenefitService.addCategory(request);
    }

    @DeleteMapping("/non-benefit/categories")
    public NonBenefitCategoriesResponse deleteNonBenefitCategory(@RequestParam String label) {
        return copayNonBenefitService.deleteCategory(label);
    }
}
