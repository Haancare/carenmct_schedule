package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentListQuery;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.support.RecipientGroupFilterSupport;
import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** 프론트 {@code filterPaymentAssignmentRecipients} 와 동일 규칙 */
@Component
@RequiredArgsConstructor
public class PaymentAssignmentFilterService {

    private static final Collator KOREAN = Collator.getInstance(Locale.KOREAN);

    private final RecipientGroupFilterSupport groupFilterSupport;

    public List<PaymentAssignmentRecipientDto> filter(
            List<PaymentAssignmentRecipientDto> recipients, PaymentAssignmentListQuery query) {
        return filter(recipients, query, null);
    }

    /**
     * @param withSchedulesRecipientIds null이면 DTO의 hasSchedulesInYear 사용,
     *     값이 있으면 해당 집합(예: 특정 월 일정 보유자)으로 일정 유무 판정
     */
    public List<PaymentAssignmentRecipientDto> filter(
            List<PaymentAssignmentRecipientDto> recipients,
            PaymentAssignmentListQuery query,
            Set<Long> withSchedulesRecipientIds) {
        Set<Long> groupRecipientIds =
                groupFilterSupport.resolveRecipientIds(query.groupIdFilter(), query.subgroupIdFilter());

        return recipients.stream()
                .filter(dto -> matches(dto, query, groupRecipientIds, withSchedulesRecipientIds))
                .sorted(Comparator.comparing(PaymentAssignmentRecipientDto::name, KOREAN))
                .toList();
    }

    private boolean matches(
            PaymentAssignmentRecipientDto recipient,
            PaymentAssignmentListQuery query,
            Set<Long> groupRecipientIds,
            Set<Long> withSchedulesRecipientIds) {
        if (!groupFilterSupport.matchesRecipient(recipient.id(), groupRecipientIds)) {
            return false;
        }
        if (StringUtils.hasText(query.nameQuery())
                && !recipient.name().contains(query.nameQuery())) {
            return false;
        }

        if (!PaymentAssignmentListQuery.ALL.equals(query.gradeFilter())
                && !query.gradeFilter().equals(recipient.gradeText())) {
            return false;
        }

        if (!PaymentAssignmentListQuery.ALL.equals(query.reductionTypeFilter())
                && !query.reductionTypeFilter().equals(reductionTypeLabel(recipient.reduction()))) {
            return false;
        }

        if (!PaymentAssignmentListQuery.ALL.equals(query.workerIdFilter())
                && !recipient.assignedCareWorkerIds().contains(query.workerIdFilter())) {
            return false;
        }

        if (!PaymentAssignmentListQuery.ALL.equals(query.serviceTypeFilter())) {
            ServiceType serviceType = ServiceType.valueOf(query.serviceTypeFilter());
            if (!recipient.serviceTypesInYear().contains(serviceType)) {
                return false;
            }
        }

        boolean isActive = "수급중".equals(recipient.contractStatus());
        boolean hasSchedules = withSchedulesRecipientIds != null
                ? withSchedulesRecipientIds.contains(Long.parseLong(recipient.id()))
                : recipient.hasSchedulesInYear();
        return hasSchedules || (query.showAllActiveRecipients() && isActive);
    }

    private String reductionTypeLabel(String reduction) {
        if (reduction != null && reduction.contains("감경")) {
            return "감경";
        }
        if (reduction != null && reduction.contains("기초")) {
            return "기초";
        }
        return "일반";
    }
}
