package com.carenmct.schedule.controller;

import com.carenmct.schedule.dto.paymentassignment.AnnualScheduleResponse;
import com.carenmct.schedule.dto.paymentassignment.CareWorkerDto;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleQuery;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleResponse;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentListQuery;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientsResponse;
import com.carenmct.schedule.dto.paymentassignment.RecipientGroupDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyRecipientListQuery;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleQuery;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleResponse;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.service.PaymentAssignmentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment-assignment")
@RequiredArgsConstructor
public class PaymentAssignmentController {

    private final PaymentAssignmentService paymentAssignmentService;

    @GetMapping("/recipients")
    public PaymentAssignmentRecipientsResponse getRecipients(
            @RequestParam int year,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String reductionType,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String workerId,
            @RequestParam(defaultValue = "true") boolean showAllActive,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId) {

        return paymentAssignmentService.getRecipients(toListQuery(
                year,
                query,
                grade,
                reductionType,
                serviceType,
                workerId,
                showAllActive,
                groupId,
                subgroupId));
    }

    @GetMapping("/annual")
    public AnnualScheduleResponse getAnnualSchedule(
            @RequestParam int year,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String reductionType,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String workerId,
            @RequestParam(defaultValue = "true") boolean showAllActive,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId) {

        return paymentAssignmentService.getAnnualSchedule(toListQuery(
                year,
                query,
                grade,
                reductionType,
                serviceType,
                workerId,
                showAllActive,
                groupId,
                subgroupId));
    }

    @GetMapping("/monthly")
    public MonthlyScheduleResponse getMonthlySchedule(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam ScheduleKind scheduleKind,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String reductionType,
            @RequestParam(required = false) String serviceType,
            @RequestParam(required = false) String workerId,
            @RequestParam(defaultValue = "true") boolean showAllActive,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId) {

        MonthlyScheduleQuery monthlyQuery = new MonthlyScheduleQuery(
                year,
                query,
                grade,
                reductionType,
                serviceType,
                workerId,
                showAllActive,
                groupId,
                subgroupId,
                month,
                scheduleKind);

        return paymentAssignmentService.getMonthlySchedule(monthlyQuery);
    }

    @GetMapping("/weekly/recipients")
    public PaymentAssignmentRecipientsResponse getWeeklyRecipients(
            @RequestParam int year,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String contractStatus,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String subgroupId) {

        WeeklyRecipientListQuery weeklyQuery =
                new WeeklyRecipientListQuery(year, query, contractStatus, groupId, subgroupId);
        return paymentAssignmentService.getWeeklyRecipients(weeklyQuery);
    }

    @GetMapping("/weekly")
    public WeeklyScheduleResponse getWeeklySchedule(
            @RequestParam String recipientId,
            @RequestParam int year,
            @RequestParam ScheduleKind scheduleKind) {

        WeeklyScheduleQuery weeklyQuery = new WeeklyScheduleQuery(recipientId, year, scheduleKind);
        return paymentAssignmentService.getWeeklySchedule(weeklyQuery);
    }

    @GetMapping("/care-workers")
    public List<CareWorkerDto> getCareWorkers() {
        return paymentAssignmentService.getCareWorkers();
    }

    @GetMapping("/recipient-groups")
    public List<RecipientGroupDto> getRecipientGroups() {
        return paymentAssignmentService.getRecipientGroups();
    }

    private static PaymentAssignmentListQuery toListQuery(
            int year,
            String query,
            String grade,
            String reductionType,
            String serviceType,
            String workerId,
            boolean showAllActive,
            String groupId,
            String subgroupId) {
        return new PaymentAssignmentListQuery(
                year,
                query,
                grade,
                reductionType,
                serviceType,
                workerId,
                showAllActive,
                groupId,
                subgroupId);
    }
}
