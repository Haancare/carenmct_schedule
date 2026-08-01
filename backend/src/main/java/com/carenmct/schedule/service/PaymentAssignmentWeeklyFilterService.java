package com.carenmct.schedule.service;

import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import com.carenmct.schedule.dto.paymentassignment.WeeklyRecipientListQuery;
import com.carenmct.schedule.support.RecipientGroupFilterSupport;
import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** 프론트 mockFetchWeeklyRecipients 와 동일 규칙 */
@Component
@RequiredArgsConstructor
public class PaymentAssignmentWeeklyFilterService {

    private static final Collator KOREAN = Collator.getInstance(Locale.KOREAN);

    private final RecipientGroupFilterSupport groupFilterSupport;

    public List<PaymentAssignmentRecipientDto> filter(
            List<PaymentAssignmentRecipientDto> recipients, WeeklyRecipientListQuery query) {

        Set<Long> groupRecipientIds =
                groupFilterSupport.resolveRecipientIds(query.groupIdFilter(), query.subgroupIdFilter());

        return recipients.stream()
                .filter(dto -> matches(dto, query, groupRecipientIds))
                .sorted(Comparator.comparing(PaymentAssignmentRecipientDto::name, KOREAN))
                .toList();
    }

    private boolean matches(
            PaymentAssignmentRecipientDto recipient,
            WeeklyRecipientListQuery query,
            Set<Long> groupRecipientIds) {
        if (!groupFilterSupport.matchesRecipient(recipient.id(), groupRecipientIds)) {
            return false;
        }
        boolean inPool = "수급중".equals(recipient.contractStatus()) || recipient.hasSchedulesInYear();
        if (!inPool) {
            return false;
        }

        if (StringUtils.hasText(query.nameQuery()) && !recipient.name().contains(query.nameQuery())) {
            return false;
        }

        if (!WeeklyRecipientListQuery.ALL.equals(query.contractStatusFilter())
                && !query.contractStatusFilter().equals(recipient.contractStatus())) {
            return false;
        }

        return true;
    }
}
