package com.carenmct.schedule.controller;

import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleFeeQuoteDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleFeeQuoteRequest;
import com.carenmct.schedule.dto.holiday.HolidayDto;
import com.carenmct.schedule.dto.scheduleassignment.CreateRecipientMemoRequest;
import com.carenmct.schedule.dto.scheduleassignment.RecipientMemoDto;
import com.carenmct.schedule.dto.scheduleassignment.RecipientServiceWorkersResponse;
import com.carenmct.schedule.dto.scheduleassignment.ReplaceRecipientServiceWorkersRequest;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentListQuery;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentListItemDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleAssignmentMonthResponse;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleYearMonthCountsResponse;
import com.carenmct.schedule.dto.scheduleassignment.WorkerScheduleEntryDto;
import com.carenmct.schedule.dto.scheduleassignment.UpdateRecipientMemoRequest;
import com.carenmct.schedule.service.HolidayService;
import com.carenmct.schedule.service.RecipientMemoService;
import com.carenmct.schedule.service.RecipientServiceWorkerService;
import com.carenmct.schedule.service.ScheduleAssignmentQueryService;
import com.carenmct.schedule.service.ServiceScheduleAssignmentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedule-assignment")
@RequiredArgsConstructor
public class ScheduleAssignmentQueryController {

    private final ScheduleAssignmentQueryService queryService;
    private final RecipientMemoService recipientMemoService;
    private final RecipientServiceWorkerService recipientServiceWorkerService;
    private final HolidayService holidayService;
    private final ServiceScheduleAssignmentService scheduleAssignmentService;

    @GetMapping("/holidays")
    public List<HolidayDto> getHolidays(@RequestParam int year) {
        return holidayService.getHolidaysForYear(year);
    }

    @PostMapping("/fee-quote")
    public ScheduleFeeQuoteDto quoteFee(@RequestBody ScheduleFeeQuoteRequest request) {
        return scheduleAssignmentService.quoteFee(request);
    }

    @GetMapping
    public List<ScheduleAssignmentListItemDto> list(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Boolean showAllActive) {
        return queryService.getList(new ScheduleAssignmentListQuery(year, month, showAllActive));
    }

    @GetMapping("/workers/{workerId}/schedules")
    public List<WorkerScheduleEntryDto> getWorkerSchedules(
            @PathVariable String workerId,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam ScheduleKind scheduleKind) {
        return queryService.getWorkerMonthSchedules(workerId, year, month, scheduleKind);
    }

    @GetMapping("/{recipientId}")
    public ScheduleAssignmentMonthResponse getMonth(
            @PathVariable String recipientId,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam ScheduleKind scheduleKind) {
        return queryService.getMonth(recipientId, year, month, scheduleKind);
    }

    @GetMapping("/{recipientId}/year-month-counts")
    public ScheduleYearMonthCountsResponse getYearMonthCounts(
            @PathVariable String recipientId, @RequestParam int year) {
        return queryService.getYearMonthCounts(recipientId, year);
    }

    @GetMapping("/{recipientId}/service-workers")
    public RecipientServiceWorkersResponse listServiceWorkers(@PathVariable String recipientId) {
        return recipientServiceWorkerService.list(recipientId);
    }

    @PutMapping("/{recipientId}/service-workers")
    public RecipientServiceWorkersResponse replaceServiceWorkers(
            @PathVariable String recipientId,
            @RequestBody ReplaceRecipientServiceWorkersRequest request) {
        return recipientServiceWorkerService.replace(recipientId, request);
    }

    @GetMapping("/{recipientId}/memos")
    public List<RecipientMemoDto> listMemos(@PathVariable String recipientId) {
        return recipientMemoService.listMemos(recipientId);
    }

    @PostMapping("/{recipientId}/memos")
    @ResponseStatus(HttpStatus.CREATED)
    public RecipientMemoDto createMemo(
            @PathVariable String recipientId, @RequestBody CreateRecipientMemoRequest request) {
        return recipientMemoService.createMemo(recipientId, request);
    }

    @PutMapping("/memos/{memoId}")
    public RecipientMemoDto updateMemo(
            @PathVariable Long memoId, @RequestBody UpdateRecipientMemoRequest request) {
        return recipientMemoService.updateMemo(memoId, request);
    }

    @PatchMapping("/memos/{memoId}/pin")
    public RecipientMemoDto togglePin(@PathVariable Long memoId) {
        return recipientMemoService.togglePin(memoId);
    }

    @DeleteMapping("/memos/{memoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMemo(@PathVariable Long memoId) {
        recipientMemoService.deleteMemo(memoId);
    }
}
