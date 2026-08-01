package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentListQuery;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyRecipientListQuery;
import com.carenmct.schedule.mapper.PaymentAssignmentMapper;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentAssignmentRecipientLoader {

    private final ComRecipientRepository comRecipientRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final PaymentAssignmentFilterService filterService;
    private final PaymentAssignmentWeeklyFilterService weeklyFilterService;
    private final FacilityScopeResolver facilityScope;

    public List<PaymentAssignmentRecipientDto> loadFiltered(PaymentAssignmentListQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        return filterService.filter(loadRecipientDtos(facilityId, query.year(), query.query()), query);
    }

    /** 월 급여일정용 — 일정 유무를 해당 월 기준으로 판정 */
    public List<PaymentAssignmentRecipientDto> loadFilteredForMonth(
            PaymentAssignmentListQuery query, int year, int month) {
        String facilityId = facilityScope.requireFacilityId();
        Set<Long> withMonthSchedules =
                serviceScheduleRepository.findRecipientIdsWithActiveInMonth(facilityId, year, month);
        return filterService.filter(
                loadRecipientDtos(facilityId, query.year(), query.query()),
                query,
                withMonthSchedules);
    }

    public List<PaymentAssignmentRecipientDto> loadWeeklyPool(WeeklyRecipientListQuery query) {
        String facilityId = facilityScope.requireFacilityId();
        return weeklyFilterService.filter(
                loadRecipientDtos(facilityId, query.year(), query.query()), query);
    }

    public PaymentAssignmentRecipientDto loadRecipientDto(String facilityId, Long recipientId, int year) {
        Recipient recipient = comRecipientRepository
                .findByIdAndFacility_Id(recipientId, facilityId)
                .orElse(null);
        if (recipient == null) {
            return null;
        }
        return toRecipientDto(facilityId, recipient, year);
    }

    /** 이미 조회한 Recipient로 DTO 구성 (중복 조회 방지) */
    public PaymentAssignmentRecipientDto toRecipientDto(String facilityId, Recipient recipient, int year) {
        Long recipientId = recipient.getId();
        Map<Long, List<Long>> assignedWorkers =
                comRecipientRepository.findAssignedEmployeeIdsByRecipientIds(List.of(recipientId));
        boolean hasSchedules = serviceScheduleRepository.existsActiveInYear(facilityId, recipientId, year);
        Set<ServiceType> serviceTypes =
                serviceScheduleRepository.findDistinctServiceTypesInYear(facilityId, recipientId, year);

        return PaymentAssignmentMapper.toRecipientDto(
                recipient,
                assignedWorkers.getOrDefault(recipientId, List.of()),
                hasSchedules,
                serviceTypes);
    }

    private List<PaymentAssignmentRecipientDto> loadRecipientDtos(
            String facilityId, int year, String nameQuery) {
        List<Recipient> recipients = comRecipientRepository.findByFacilityId(facilityId, nameQuery);
        if (recipients.isEmpty()) {
            return List.of();
        }

        Map<Long, List<Long>> assignedWorkers =
                comRecipientRepository.findAssignedEmployeeIdsByFacilityId(facilityId);
        Set<Long> withSchedules =
                serviceScheduleRepository.findRecipientIdsWithActiveInYear(facilityId, year);
        Map<Long, Set<ServiceType>> serviceTypesByRecipient =
                serviceScheduleRepository.findDistinctServiceTypesInYearByFacility(facilityId, year);

        List<PaymentAssignmentRecipientDto> dtos = new ArrayList<>(recipients.size());
        for (Recipient recipient : recipients) {
            Long recipientId = recipient.getId();
            dtos.add(PaymentAssignmentMapper.toRecipientDto(
                    recipient,
                    assignedWorkers.getOrDefault(recipientId, List.of()),
                    withSchedules.contains(recipientId),
                    serviceTypesByRecipient.getOrDefault(recipientId, Set.of())));
        }
        return dtos;
    }
}
