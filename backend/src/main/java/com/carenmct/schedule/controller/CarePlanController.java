package com.carenmct.schedule.controller;

import com.carenmct.schedule.domain.schedule.enums.AssessmentDocType;
import com.carenmct.schedule.dto.careplan.AssessmentDocumentDetailDto;
import com.carenmct.schedule.dto.careplan.AssessmentDocumentSummaryDto;
import com.carenmct.schedule.dto.careplan.CarePlanRecipientDto;
import com.carenmct.schedule.dto.careplan.CreateAssessmentDocumentRequest;
import com.carenmct.schedule.dto.careplan.UpdateAssessmentDocumentRequest;
import com.carenmct.schedule.service.CarePlanService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/care-plan")
@RequiredArgsConstructor
public class CarePlanController {

    private final CarePlanService carePlanService;

    @GetMapping("/recipients")
    public List<CarePlanRecipientDto> listRecipients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId) {
        return carePlanService.listRecipients(query, activeOnly, groupId, subgroupId);
    }

    @GetMapping("/recipients/{recipientId}/documents")
    public List<AssessmentDocumentSummaryDto> listDocuments(
            @PathVariable String recipientId, @RequestParam AssessmentDocType docType) {
        return carePlanService.listDocuments(recipientId, docType);
    }

    @GetMapping("/documents/{id}")
    public AssessmentDocumentDetailDto getDocument(@PathVariable Long id) {
        return carePlanService.getDocument(id);
    }

    @PostMapping("/documents")
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentDocumentDetailDto create(@RequestBody CreateAssessmentDocumentRequest request) {
        return carePlanService.create(request);
    }

    @PutMapping("/documents/{id}")
    public AssessmentDocumentDetailDto update(
            @PathVariable Long id, @RequestBody UpdateAssessmentDocumentRequest request) {
        return carePlanService.update(id, request);
    }

    @DeleteMapping("/documents/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        carePlanService.delete(id);
    }
}
