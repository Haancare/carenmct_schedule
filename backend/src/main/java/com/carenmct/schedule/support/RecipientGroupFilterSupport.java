package com.carenmct.schedule.support;

import com.carenmct.schedule.repository.com.ComGroupMemberRepository;
import com.carenmct.schedule.repository.com.ComGroupRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class RecipientGroupFilterSupport {

    public static final String ALL = "all";

    private final ComGroupRepository comGroupRepository;
    private final ComGroupMemberRepository comGroupMemberRepository;
    private final FacilityScopeResolver facilityScope;

    /**
     * 그룹 필터가 없으면 {@code null}(전체 허용).
     * 그룹이 지정되면 해당 그룹(·소그룹)에 속한 수급자 ID 집합을 반환한다.
     */
    public Set<Long> resolveRecipientIds(String groupId, String subgroupId) {
        if (!isActiveFilter(groupId)) {
            return null;
        }

        String facilityId = facilityScope.requireFacilityId();
        Long parsedGroupId = parseId(groupId, "groupId");
        comGroupRepository
                .findByIdAndFacility_Id(parsedGroupId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 groupId 입니다."));

        Long parsedSubgroupId = isActiveFilter(subgroupId) ? parseId(subgroupId, "subgroupId") : null;
        return comGroupMemberRepository.findRecipientIdsInGroup(parsedGroupId, parsedSubgroupId);
    }

    public boolean matchesRecipient(String recipientId, Set<Long> allowedRecipientIds) {
        if (allowedRecipientIds == null) {
            return true;
        }
        return allowedRecipientIds.contains(Long.parseLong(recipientId));
    }

    private static boolean isActiveFilter(String value) {
        return value != null && !value.isBlank() && !ALL.equals(value);
    }

    private static Long parseId(String value, String fieldName) {
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "유효하지 않은 " + fieldName + " 입니다.");
        }
    }
}
