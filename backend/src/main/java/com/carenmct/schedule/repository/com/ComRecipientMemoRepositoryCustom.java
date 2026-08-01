package com.carenmct.schedule.repository.com;

import java.util.Map;

public interface ComRecipientMemoRepositoryCustom {

    Map<String, String> findDayMemosByRecipientAndYear(Long recipientId, int year);

    java.util.List<com.carenmct.schedule.domain.com.RecipientMemo> findMemosByRecipient(
            Long recipientId);
}
