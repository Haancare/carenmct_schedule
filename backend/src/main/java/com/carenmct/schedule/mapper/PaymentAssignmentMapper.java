package com.carenmct.schedule.mapper;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyScheduleEntryDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleEntryResponse;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class PaymentAssignmentMapper {

    private PaymentAssignmentMapper() {}

    public static WeeklyScheduleEntryDto toWeeklyEntry(ServiceSchedule schedule) {
        return new WeeklyScheduleEntryDto(
                schedule.getServiceDate().toString(),
                schedule.getServiceType(),
                schedule.getScheduleKind(),
                formatTime(schedule.getStartTime()),
                formatTime(schedule.getEndTime()),
                schedule.getDurationMinutes(),
                String.valueOf(schedule.getEmployeeId()),
                schedule.getId(),
                schedule.getUnitCost(),
                schedule.getSurchargeAmount(),
                schedule.getBenefitTotal(),
                schedule.getGradeSnapshot(),
                schedule.getReductionSnapshot(),
                schedule.getCopayRateSnapshot());
    }

    public static ScheduleEntryResponse toScheduleEntryResponse(ServiceSchedule schedule) {
        return new ScheduleEntryResponse(
                schedule.getId(),
                String.valueOf(schedule.getRecipientId()),
                String.valueOf(schedule.getEmployeeId()),
                schedule.getServiceDate().toString(),
                schedule.getServiceType(),
                schedule.getScheduleKind(),
                formatTime(schedule.getStartTime()),
                formatTime(schedule.getEndTime()),
                schedule.getDurationMinutes(),
                schedule.getUnitCost(),
                schedule.getSurchargeAmount(),
                schedule.getBenefitTotal(),
                Boolean.TRUE.equals(schedule.getFeeEdited()),
                schedule.getFeeCode(),
                schedule.getFamilyRelation(),
                schedule.getGradeSnapshot(),
                schedule.getReductionSnapshot(),
                schedule.getCopayRateSnapshot());
    }

    private static String formatTime(java.time.LocalTime time) {
        return String.format("%02d:%02d", time.getHour(), time.getMinute());
    }

    public static PaymentAssignmentRecipientDto toRecipientDto(
            Recipient recipient,
            List<Long> assignedEmployeeIds,
            boolean hasSchedulesInYear,
            Set<ServiceType> serviceTypesInYear) {
        return new PaymentAssignmentRecipientDto(
                String.valueOf(recipient.getId()),
                recipient.getName(),
                recipient.getLegalDob().toString(),
                recipient.getGrade(),
                recipient.getReduction(),
                recipient.getCertNo() != null ? recipient.getCertNo() : "",
                recipient.getContractStatus(),
                assignedEmployeeIds.stream().map(String::valueOf).collect(Collectors.toList()),
                hasSchedulesInYear,
                serviceTypesInYear.stream().sorted().collect(Collectors.toList()));
    }
}
