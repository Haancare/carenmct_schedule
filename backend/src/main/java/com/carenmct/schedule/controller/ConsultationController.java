package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.consultation.ConsultWorkerDto;
import com.carenmct.schedule.dto.consultation.ConsultationRecipientDto;
import com.carenmct.schedule.dto.consultation.ConsultationVisitDto;
import com.carenmct.schedule.dto.consultation.CreateConsultationVisitRequest;
import com.carenmct.schedule.dto.consultation.CreateWorkJournalRequest;
import com.carenmct.schedule.dto.consultation.RecipientScheduleItemDto;
import com.carenmct.schedule.dto.consultation.UpdateConsultationVisitRequest;
import com.carenmct.schedule.dto.consultation.UpdateWorkJournalRequest;
import com.carenmct.schedule.dto.consultation.WorkJournalDetailDto;
import com.carenmct.schedule.dto.consultation.WorkJournalSummaryDto;
import com.carenmct.schedule.service.ConsultationService;
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
@RequestMapping("/api/consultation")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @GetMapping("/workers")
    public List<ConsultWorkerDto> listWorkers(
            @RequestParam(required = false, defaultValue = "all") String status) {
        return consultationService.listWorkers(status);
    }

    @GetMapping("/visits")
    public List<ConsultationVisitDto> listVisits(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String recipientId) {
        return consultationService.listVisits(year, month, employeeId, recipientId);
    }

    @PostMapping("/visits")
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultationVisitDto createVisit(@RequestBody CreateConsultationVisitRequest request) {
        return consultationService.createVisit(request);
    }

    @PutMapping("/visits/{id}")
    public ConsultationVisitDto updateVisit(
            @PathVariable Long id, @RequestBody UpdateConsultationVisitRequest request) {
        return consultationService.updateVisit(id, request);
    }

    @DeleteMapping("/visits/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVisit(@PathVariable Long id) {
        consultationService.deleteVisit(id);
    }

    @GetMapping("/recipients")
    public List<ConsultationRecipientDto> listRecipients(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) String gradeFilter,
            @RequestParam(required = false) String serviceFilter,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Boolean hasSchedulesInMonth) {
        return consultationService.listRecipients(
                query,
                activeOnly,
                gradeFilter,
                serviceFilter,
                groupId,
                subgroupId,
                year,
                month,
                hasSchedulesInMonth);
    }

    @GetMapping("/recipients/{recipientId}/schedules")
    public List<RecipientScheduleItemDto> listRecipientSchedules(
            @PathVariable String recipientId, @RequestParam int year, @RequestParam int month) {
        return consultationService.listRecipientSchedules(recipientId, year, month);
    }

    @GetMapping("/journals")
    public List<WorkJournalSummaryDto> listJournals(
            @RequestParam(required = false) String recipientId,
            @RequestParam(required = false) String visitId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return consultationService.listJournals(recipientId, visitId, year, month);
    }

    @GetMapping("/journals/{id}")
    public WorkJournalDetailDto getJournal(@PathVariable Long id) {
        return consultationService.getJournal(id);
    }

    @PostMapping("/journals")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkJournalDetailDto createJournal(@RequestBody CreateWorkJournalRequest request) {
        return consultationService.createJournal(request);
    }

    @PutMapping("/journals/{id}")
    public WorkJournalDetailDto updateJournal(
            @PathVariable Long id, @RequestBody UpdateWorkJournalRequest request) {
        return consultationService.updateJournal(id, request);
    }

    @DeleteMapping("/journals/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJournal(@PathVariable Long id) {
        consultationService.deleteJournal(id);
    }
}
