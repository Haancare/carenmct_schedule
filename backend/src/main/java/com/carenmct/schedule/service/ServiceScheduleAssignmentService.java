package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.scheduleassignment.ApplyPeriodChangeRequest;
import com.carenmct.schedule.dto.scheduleassignment.BulkCreateSchedulesRequest;
import com.carenmct.schedule.dto.scheduleassignment.BulkCreateSchedulesResponse;
import com.carenmct.schedule.dto.scheduleassignment.BulkDeleteSchedulesRequest;
import com.carenmct.schedule.dto.scheduleassignment.CreateScheduleRequest;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleEntryResponse;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleFeeQuoteDto;
import com.carenmct.schedule.dto.scheduleassignment.ScheduleFeeQuoteRequest;
import com.carenmct.schedule.dto.scheduleassignment.UpdateScheduleFeeRequest;
import com.carenmct.schedule.mapper.PaymentAssignmentMapper;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.support.ScheduleOverlapSupport;
import com.carenmct.schedule.support.ScheduleServiceTypeValidator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ServiceScheduleAssignmentService {

    private final ServiceScheduleRepository serviceScheduleRepository;
    private final FacilityScopeResolver facilityScope;
    private final ScheduleFeeCalculator scheduleFeeCalculator;
    private final ScheduleSurchargeCalculator scheduleSurchargeCalculator;
    private final HolidayService holidayService;

    public ScheduleFeeQuoteDto quoteFee(ScheduleFeeQuoteRequest request) {
        LocalDate serviceDate = LocalDate.parse(request.serviceDate());
        LocalTime startTime = LocalTime.parse(request.startTime());

        ScheduleServiceTypeValidator.validate(
                request.serviceType(), request.durationMinutes(), request.familyRelation());

        Set<LocalDate> holidayDates = holidayService.holidayDatesForYear(request.year());
        ScheduleFeeCalculator.ScheduleFeeQuote feeQuote =
                scheduleFeeCalculator.calculate(
                        request.year(),
                        request.serviceType(),
                        request.durationMinutes(),
                        request.gradeSnapshot(),
                        request.bathType());

        ScheduleSurchargeCalculator.ScheduleSurchargeQuote surchargeQuote =
                scheduleSurchargeCalculator.calculateForChunks(
                        request.serviceType(),
                        serviceDate,
                        startTime,
                        request.gradeSnapshot(),
                        feeQuote.chunks(),
                        holidayDates);

        return new ScheduleFeeQuoteDto(
                feeQuote.unitCost(),
                feeQuote.feeCode(),
                surchargeQuote.surchargeAmount(),
                surchargeQuote.surchargeRate(),
                surchargeQuote.surchargeMinutes(),
                surchargeQuote.periodLabel());
    }

    @Transactional
    public ScheduleEntryResponse create(CreateScheduleRequest request) {
        ScheduleFeeCalculator.FeeHeaderCache feeCache = new ScheduleFeeCalculator.FeeHeaderCache();
        LocalDate serviceDate = LocalDate.parse(request.serviceDate());
        Set<LocalDate> holidayDates = holidayService.holidayDatesForYear(serviceDate.getYear());
        return toEntryResponse(createInternal(request, true, feeCache, holidayDates));
    }

    @Transactional
    public BulkCreateSchedulesResponse bulkCreate(BulkCreateSchedulesRequest request) {
        if (request.serviceDates() == null || request.serviceDates().isEmpty()) {
            return new BulkCreateSchedulesResponse(List.of(), 0);
        }

        String facilityId = facilityScope.requireFacilityId();
        Long recipientId = parseLongId(request.recipientId(), "recipientId");
        Long employeeId = parseLongId(request.employeeId(), "employeeId");
        LocalTime startTime = LocalTime.parse(request.startTime());
        LocalTime endTime = LocalTime.parse(request.endTime());

        ScheduleFeeCalculator.FeeHeaderCache feeCache = new ScheduleFeeCalculator.FeeHeaderCache();
        int year = LocalDate.parse(request.serviceDates().get(0)).getYear();
        Set<LocalDate> holidayDates = holidayService.holidayDatesForYear(year);

        List<ScheduleEntryResponse> created = new ArrayList<>();
        int skipped = 0;

        for (String dateText : request.serviceDates()) {
            LocalDate serviceDate = LocalDate.parse(dateText);
            if (serviceScheduleRepository.existsActivePlanDuplicate(
                    facilityId, recipientId, serviceDate, employeeId, request.serviceType(), startTime, endTime)) {
                skipped++;
                continue;
            }
            if (hasPlanScheduleConflict(
                    facilityId, recipientId, employeeId, serviceDate, request.serviceType(), startTime, endTime)) {
                skipped++;
                continue;
            }

            CreateScheduleRequest single = new CreateScheduleRequest(
                    request.recipientId(),
                    request.employeeId(),
                    dateText,
                    request.serviceType(),
                    ScheduleKind.plan,
                    request.startTime(),
                    request.endTime(),
                    request.durationMinutes(),
                    request.unitCost(),
                    request.gradeSnapshot(),
                    request.reductionSnapshot(),
                    request.copayRateSnapshot(),
                    request.bathType(),
                    request.familyRelation());

            created.add(toEntryResponse(createInternal(single, false, feeCache, holidayDates)));
        }

        return new BulkCreateSchedulesResponse(created, skipped);
    }

    private ServiceSchedule createInternal(
            CreateScheduleRequest request,
            boolean rejectDuplicate,
            ScheduleFeeCalculator.FeeHeaderCache feeCache,
            Set<LocalDate> holidayDates) {
        String facilityId = facilityScope.requireFacilityId();
        Long recipientId = parseLongId(request.recipientId(), "recipientId");
        Long employeeId = parseLongId(request.employeeId(), "employeeId");
        LocalDate serviceDate = LocalDate.parse(request.serviceDate());
        LocalTime startTime = LocalTime.parse(request.startTime());
        LocalTime endTime = LocalTime.parse(request.endTime());
        ScheduleKind scheduleKind =
                request.scheduleKind() != null ? request.scheduleKind() : ScheduleKind.plan;

        if (scheduleKind != ScheduleKind.plan) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only plan schedules can be created manually");
        }

        if (rejectDuplicate
                && serviceScheduleRepository.existsActivePlanDuplicate(
                        facilityId, recipientId, serviceDate, employeeId, request.serviceType(), startTime, endTime)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Duplicate schedule exists");
        }

        if (hasPlanScheduleConflict(
                facilityId, recipientId, employeeId, serviceDate, request.serviceType(), startTime, endTime)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Schedule time overlap exists");
        }

        ScheduleServiceTypeValidator.validate(
                request.serviceType(), request.durationMinutes(), request.familyRelation());

        ScheduleFeeCalculator.ScheduleFeeQuote feeQuote =
                scheduleFeeCalculator.calculate(
                        serviceDate.getYear(),
                        request.serviceType(),
                        request.durationMinutes(),
                        request.gradeSnapshot(),
                        request.bathType(),
                        feeCache);
        ScheduleSurchargeCalculator.ScheduleSurchargeQuote surchargeQuote =
                scheduleSurchargeCalculator.calculateForChunks(
                        request.serviceType(),
                        serviceDate,
                        startTime,
                        request.gradeSnapshot(),
                        feeQuote.chunks(),
                        holidayDates);
        BigDecimal copayRate =
                request.copayRateSnapshot() != null ? request.copayRateSnapshot() : new BigDecimal("15.00");

        ServiceSchedule schedule = ServiceSchedule.createManual(
                facilityId,
                recipientId,
                employeeId,
                serviceDate,
                request.serviceType(),
                scheduleKind,
                startTime,
                endTime,
                request.durationMinutes(),
                feeQuote.unitCost(),
                feeQuote.feeCode(),
                surchargeQuote.surchargeAmount(),
                surchargeQuote.surchargeRate(),
                surchargeQuote.surchargeMinutes(),
                request.gradeSnapshot(),
                request.reductionSnapshot(),
                copayRate,
                request.bathType(),
                request.familyRelation());

        return serviceScheduleRepository.save(schedule);
    }

    @Transactional
    public ScheduleEntryResponse updateFee(Long scheduleId, UpdateScheduleFeeRequest request) {
        ServiceSchedule schedule = requireSchedule(scheduleId);
        if (schedule.getScheduleKind() != ScheduleKind.plan) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Only plan schedules can have fee updated manually");
        }
        BigDecimal copayRate =
                schedule.getCopayRateSnapshot() != null
                        ? schedule.getCopayRateSnapshot()
                        : new BigDecimal("15.00");
        schedule.updateFee(request.unitCost(), request.surchargeAmount(), copayRate);
        return toEntryResponse(schedule);
    }

    @Transactional
    public void delete(Long scheduleId) {
        ServiceSchedule schedule = requireSchedule(scheduleId);
        schedule.softDelete();
    }

    @Transactional
    public int bulkDelete(BulkDeleteSchedulesRequest request) {
        if (request.scheduleIds() == null || request.scheduleIds().isEmpty()) {
            return 0;
        }
        String facilityId = facilityScope.requireFacilityId();
        int count = 0;
        for (Long id : request.scheduleIds()) {
            var scheduleOpt = serviceScheduleRepository.findActiveById(facilityId, id);
            if (scheduleOpt.isPresent()) {
                ServiceSchedule schedule = scheduleOpt.get();
                schedule.softDelete();
                count++;
            }
        }
        return count;
    }

    @Transactional
    public List<ScheduleEntryResponse> applyPeriodChange(ApplyPeriodChangeRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        Long recipientId = parseLongId(request.recipientId(), "recipientId");
        LocalDate splitDate = LocalDate.parse(request.splitDate());
        YearMonth ym = YearMonth.of(request.year(), request.month());
        if (splitDate.isBefore(ym.atDay(1)) || splitDate.isAfter(ym.atEndOfMonth())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "splitDate must be within the month");
        }

        List<ServiceSchedule> schedules =
                serviceScheduleRepository.findActiveForRecipientMonth(
                        facilityId, recipientId, request.year(), request.month());

        List<ScheduleEntryResponse> updated = new ArrayList<>();
        for (ServiceSchedule schedule : schedules) {
            if (schedule.getScheduleKind() != ScheduleKind.plan) {
                continue;
            }
            boolean inAfter = !schedule.getServiceDate().isBefore(splitDate);
            if ("grade".equals(request.kind())) {
                String grade = inAfter ? request.after() : request.before();
                schedule.applySnapshot(
                        grade,
                        schedule.getReductionSnapshot(),
                        schedule.getCopayRateSnapshot());
            } else if ("reduction".equals(request.kind())) {
                String reduction = inAfter ? request.after() : request.before();
                BigDecimal rate = copayRateFromReduction(reduction);
                schedule.applySnapshot(schedule.getGradeSnapshot(), reduction, rate);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "kind must be grade or reduction");
            }
            updated.add(PaymentAssignmentMapper.toScheduleEntryResponse(schedule));
        }

        return updated;
    }

    private ScheduleEntryResponse toEntryResponse(ServiceSchedule schedule) {
        return PaymentAssignmentMapper.toScheduleEntryResponse(schedule);
    }

    private ServiceSchedule requireSchedule(Long scheduleId) {
        String facilityId = facilityScope.requireFacilityId();
        return serviceScheduleRepository
                .findActiveById(facilityId, scheduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Schedule not found"));
    }

    private boolean hasPlanScheduleConflict(
            String facilityId,
            Long recipientId,
            Long employeeId,
            LocalDate serviceDate,
            ServiceType serviceType,
            LocalTime startTime,
            LocalTime endTime) {
        var recipientPlans =
                serviceScheduleRepository.findActiveRecipientPlansOnDate(
                        facilityId, recipientId, serviceDate);
        if (ScheduleOverlapSupport.hasRecipientPlanOverlap(
                recipientPlans, serviceType, startTime, endTime)) {
            return true;
        }

        var employeePlans =
                serviceScheduleRepository.findActiveEmployeePlansOnDate(
                        facilityId, employeeId, serviceDate);
        return ScheduleOverlapSupport.hasEmployeePlanOverlapWithOtherRecipients(
                employeePlans, recipientId, serviceType, startTime, endTime);
    }

    private static Long parseLongId(String value, String field) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + field);
        }
    }

    private static BigDecimal copayRateFromReduction(String reduction) {
        if (reduction == null) {
            return new BigDecimal("15.00");
        }
        if (reduction.contains("9")) {
            return new BigDecimal("9.00");
        }
        if (reduction.contains("6")) {
            return new BigDecimal("6.00");
        }
        if (reduction.contains("기초")) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal("15.00");
    }
}
