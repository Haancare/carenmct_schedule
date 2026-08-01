package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.copay.CopayConfirmation;
import com.carenmct.schedule.domain.schedule.enums.CopayConfirmType;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.copayconfirmation.ApplyRecipientConfirmRequest;
import com.carenmct.schedule.dto.copayconfirmation.ApplyRecipientConfirmRequest.ConfirmAction;
import com.carenmct.schedule.dto.copayconfirmation.BulkCancelRequest;
import com.carenmct.schedule.dto.copayconfirmation.BulkConfirmRequest;
import com.carenmct.schedule.dto.copayconfirmation.BulkConfirmRequest.BulkConfirmScope;
import com.carenmct.schedule.dto.copayconfirmation.CopayAmountsDto;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationListQuery;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationMutationResponse;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.ServiceScheduleRepository;
import com.carenmct.schedule.repository.schedule.copay.CopayConfirmationRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.security.UserScope;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator;
import com.carenmct.schedule.service.copay.CopaySegmentAggregator.PeriodSegment;
import com.carenmct.schedule.service.copay.CopaySegmentResolver;
import com.carenmct.schedule.service.copay.CopaySegmentTarget;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(transactionManager = "scheduleTransactionManager")
public class CopayConfirmationCommandService {

    private static final String ACTIVE_CONTRACT = "수급중";

    private final FacilityScopeResolver facilityScope;
    private final ComRecipientRepository comRecipientRepository;
    private final ServiceScheduleRepository serviceScheduleRepository;
    private final CopayConfirmationRepository copayConfirmationRepository;
    private final CopaySegmentResolver segmentResolver;
    private final ReferenceBenefitLimitService referenceBenefitLimitService;

    public CopayConfirmationMutationResponse applyRecipientConfirm(
            String recipientId, ApplyRecipientConfirmRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseLongId(recipientId);
        validateMonth(request.month());

        Recipient recipient = comRecipientRepository
                .findByIdAndFacility_Id(recipientLongId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
        if (!ACTIVE_CONTRACT.equals(recipient.getContractStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수급중 수급자만 확정할 수 있습니다.");
        }

        List<ServiceSchedule> monthSchedules = serviceScheduleRepository.findActiveForRecipientMonth(
                facilityId, recipientLongId, request.year(), request.month());
        int limitExcess = computeLimitExcess(monthSchedules, recipient.getGrade(), request.year());
        Long confirmedBy = UserScope.currentUserIdOrNull();

        int affected = 0;
        for (ApplyRecipientConfirmRequest.ConfirmSelectionDto selection : request.selections()) {
            if (selection.action() == ConfirmAction.none) {
                affected += deleteIfExists(
                        recipientLongId, request.year(), request.month(), selection.serviceType(), selection.periodKey())
                        ? 1
                        : 0;
                continue;
            }

            PeriodSegment segment = CopaySegmentAggregator.buildPeriodSegments(
                            monthSchedules, selection.serviceType(), recipient)
                    .stream()
                    .filter(item -> item.periodKey().equals(selection.periodKey()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "확정 대상 세그먼트를 찾을 수 없습니다: " + selection.periodKey()));

            ResolvedAmounts amounts = resolveAmounts(selection, segment);
            CopayConfirmType confirmType = toConfirmType(selection.action());

            upsert(
                    facilityId,
                    recipientLongId,
                    request.year(),
                    request.month(),
                    selection.serviceType(),
                    segment,
                    confirmType,
                    amounts,
                    limitExcess,
                    confirmedBy);
            affected++;
        }

        return new CopayConfirmationMutationResponse(affected);
    }

    public CopayConfirmationMutationResponse bulkConfirm(BulkConfirmRequest request) {
        if (request.basis() != CopayConfirmType.plan && request.basis() != CopayConfirmType.claim) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "일괄확정 basis 는 plan 또는 claim 이어야 합니다.");
        }
        validateMonth(request.month());

        CopayConfirmationListQuery listQuery = toListQuery(request);
        Set<Long> recipientFilter = resolveRecipientFilter(request);

        if (request.scope() == BulkConfirmScope.selected && recipientFilter.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택 일괄확정에는 recipientIds 가 필요합니다.");
        }

        String facilityId = facilityScope.requireFacilityId();
        List<CopaySegmentTarget> targets = segmentResolver.resolveTargets(facilityId, listQuery, recipientFilter);
        Long confirmedBy = UserScope.currentUserIdOrNull();

        int affected = 0;
        for (CopaySegmentTarget target : targets) {
            if (request.scope() == BulkConfirmScope.unconfirmed && target.existingConfirmation() != null) {
                continue;
            }

            Recipient recipient = target.recipient();
            List<ServiceSchedule> monthSchedules = serviceScheduleRepository.findActiveForRecipientMonth(
                    facilityId, recipient.getId(), request.year(), request.month());
            int limitExcess = computeLimitExcess(monthSchedules, recipient.getGrade(), request.year());

            CopayAmountsDto amounts =
                    request.basis() == CopayConfirmType.plan ? target.segment().plan() : target.segment().claim();
            ResolvedAmounts resolved = new ResolvedAmounts(
                    amounts.count(), amounts.benefit(), amounts.insurance(), amounts.copay());

            upsert(
                    facilityId,
                    recipient.getId(),
                    request.year(),
                    request.month(),
                    target.serviceType(),
                    target.segment(),
                    request.basis(),
                    resolved,
                    limitExcess,
                    confirmedBy);
            affected++;
        }

        return new CopayConfirmationMutationResponse(affected);
    }

    public CopayConfirmationMutationResponse bulkCancel(BulkCancelRequest request) {
        validateMonth(request.month());
        if (request.recipientIds() == null || request.recipientIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recipientIds 가 필요합니다.");
        }

        Set<Long> recipientFilter = request.recipientIds().stream()
                .map(id -> parseLongId(id))
                .collect(Collectors.toSet());

        String facilityId = facilityScope.requireFacilityId();
        CopayConfirmationListQuery listQuery = new CopayConfirmationListQuery(
                request.year(),
                request.month(),
                request.query(),
                CopayConfirmationListQuery.parseStatus(request.status()),
                CopayConfirmationListQuery.parseServiceType(request.serviceType()));

        List<CopaySegmentTarget> targets = segmentResolver.resolveTargets(facilityId, listQuery, recipientFilter);

        int affected = 0;
        for (CopaySegmentTarget target : targets) {
            if (target.existingConfirmation() == null) {
                continue;
            }
            copayConfirmationRepository.deleteByRecipientIdAndServiceYearAndServiceMonthAndServiceTypeAndPeriodKey(
                    target.recipient().getId(),
                    request.year(),
                    request.month(),
                    target.serviceType(),
                    target.segment().periodKey());
            affected++;
        }

        return new CopayConfirmationMutationResponse(affected);
    }

    private void upsert(
            String facilityId,
            long recipientId,
            int year,
            int month,
            ServiceType serviceType,
            PeriodSegment segment,
            CopayConfirmType confirmType,
            ResolvedAmounts amounts,
            int limitExcess,
            Long confirmedBy) {
        copayConfirmationRepository
                .findByRecipientIdAndServiceYearAndServiceMonthAndServiceTypeAndPeriodKey(
                        recipientId, year, month, serviceType, segment.periodKey())
                .ifPresentOrElse(
                        existing -> existing.apply(
                                confirmType,
                                amounts.count(),
                                amounts.benefitTotal(),
                                amounts.insuranceAmount(),
                                amounts.copayAmount(),
                                limitExcess,
                                confirmedBy),
                        () -> copayConfirmationRepository.save(CopayConfirmation.create(
                                facilityId,
                                recipientId,
                                year,
                                month,
                                serviceType,
                                segment.periodKey(),
                                segment.gradeNum(),
                                segment.reduction(),
                                segment.copayRate(),
                                confirmType,
                                amounts.count(),
                                amounts.benefitTotal(),
                                amounts.insuranceAmount(),
                                amounts.copayAmount(),
                                limitExcess,
                                confirmedBy)));
    }

    private boolean deleteIfExists(
            long recipientId, int year, int month, ServiceType serviceType, String periodKey) {
        var existing = copayConfirmationRepository.findByRecipientIdAndServiceYearAndServiceMonthAndServiceTypeAndPeriodKey(
                recipientId, year, month, serviceType, periodKey);
        if (existing.isEmpty()) {
            return false;
        }
        copayConfirmationRepository.delete(existing.get());
        return true;
    }

    private static ResolvedAmounts resolveAmounts(
            ApplyRecipientConfirmRequest.ConfirmSelectionDto selection, PeriodSegment segment) {
        return switch (selection.action()) {
            case plan -> fromAmounts(segment.plan());
            case claim -> fromAmounts(segment.claim());
            case manual -> new ResolvedAmounts(
                    selection.count() != null ? selection.count() : 0,
                    (selection.insuranceAmount() != null ? selection.insuranceAmount() : 0)
                            + (selection.copayAmount() != null ? selection.copayAmount() : 0),
                    selection.insuranceAmount() != null ? selection.insuranceAmount() : 0,
                    selection.copayAmount() != null ? selection.copayAmount() : 0);
            case none -> throw new IllegalStateException("none");
        };
    }

    private static ResolvedAmounts fromAmounts(CopayAmountsDto amounts) {
        return new ResolvedAmounts(amounts.count(), amounts.benefit(), amounts.insurance(), amounts.copay());
    }

    private static CopayConfirmType toConfirmType(ConfirmAction action) {
        return switch (action) {
            case plan -> CopayConfirmType.plan;
            case claim -> CopayConfirmType.claim;
            case manual -> CopayConfirmType.manual;
            case none -> throw new IllegalStateException("none");
        };
    }

    private int computeLimitExcess(List<ServiceSchedule> monthSchedules, String gradeText, int year) {
        int gradeNum = CopaySegmentAggregator.resolveGradeForLimit(monthSchedules, gradeText);
        int monthlyLimit = referenceBenefitLimitService.lookupLimit(year, gradeNum);
        int used = CopaySegmentAggregator.sumPlanLimitUsage(monthSchedules);
        return Math.max(0, used - monthlyLimit);
    }

    private static CopayConfirmationListQuery toListQuery(BulkConfirmRequest request) {
        return new CopayConfirmationListQuery(
                request.year(),
                request.month(),
                request.query(),
                CopayConfirmationListQuery.parseStatus(request.status()),
                CopayConfirmationListQuery.parseServiceType(request.serviceType()));
    }

    private static Set<Long> resolveRecipientFilter(BulkConfirmRequest request) {
        if (request.scope() != BulkConfirmScope.selected) {
            return Set.of();
        }
        return request.recipientIds().stream().map(CopayConfirmationCommandService::parseLongId).collect(Collectors.toSet());
    }

    private static void validateMonth(int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be 1-12");
        }
    }

    private static long parseLongId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id: " + value);
        }
    }

    private record ResolvedAmounts(int count, int benefitTotal, int insuranceAmount, int copayAmount) {}
}
