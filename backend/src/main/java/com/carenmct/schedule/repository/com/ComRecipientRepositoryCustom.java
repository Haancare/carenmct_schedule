package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.Recipient;
import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface ComRecipientRepositoryCustom {

    List<Recipient> findByFacilityId(String facilityId, String nameQuery);

    Map<Long, List<Long>> findAssignedEmployeeIdsByRecipientIds(Collection<Long> recipientIds);

    /** 기관 소속 수급자의 담당 직원 (facility 기준, IN 없음) */
    Map<Long, List<Long>> findAssignedEmployeeIdsByFacilityId(String facilityId);
}
