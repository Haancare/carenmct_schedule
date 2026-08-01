package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.scheduleassignment.ApplyPeriodChangeRequest;
import com.carenmct.schedule.dto.scheduleassignment.BulkCreateSchedulesRequest;
import com.carenmct.schedule.dto.scheduleassignment.BulkCreateSchedulesResponse;
import com.carenmct.schedule.dto.scheduleassignment.BulkDeleteSchedulesRequest;
import com.carenmct.schedule.dto.scheduleassignment.CreateScheduleRequest;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleEntryResponse;
import com.carenmct.schedule.dto.scheduleassignment.UpdateScheduleFeeRequest;
import com.carenmct.schedule.service.ServiceScheduleAssignmentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedule-assignment/schedules")
@RequiredArgsConstructor
public class ServiceScheduleAssignmentController {

    private final ServiceScheduleAssignmentService scheduleAssignmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleEntryResponse create(@RequestBody CreateScheduleRequest request) {
        return scheduleAssignmentService.create(request);
    }

    @PostMapping("/bulk-create")
    @ResponseStatus(HttpStatus.CREATED)
    public BulkCreateSchedulesResponse bulkCreate(@RequestBody BulkCreateSchedulesRequest request) {
        return scheduleAssignmentService.bulkCreate(request);
    }

    @PatchMapping("/{scheduleId}/fee")
    public ScheduleEntryResponse updateFee(
            @PathVariable Long scheduleId, @RequestBody UpdateScheduleFeeRequest request) {
        return scheduleAssignmentService.updateFee(scheduleId, request);
    }

    @DeleteMapping("/{scheduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long scheduleId) {
        scheduleAssignmentService.delete(scheduleId);
    }

    @PostMapping("/bulk-delete")
    public int bulkDelete(@RequestBody BulkDeleteSchedulesRequest request) {
        return scheduleAssignmentService.bulkDelete(request);
    }

    @PostMapping("/apply-period-change")
    public List<ScheduleEntryResponse> applyPeriodChange(@RequestBody ApplyPeriodChangeRequest request) {
        return scheduleAssignmentService.applyPeriodChange(request);
    }
}
