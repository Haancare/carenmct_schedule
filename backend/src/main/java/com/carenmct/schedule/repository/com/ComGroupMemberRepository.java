package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.ComGroupMember;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ComGroupMemberRepository extends JpaRepository<ComGroupMember, Long> {

    @Query(
            """
            SELECT gm.memberId
            FROM ComGroupMember gm
            WHERE gm.group.id = :groupId
              AND gm.memberType = 'recipient'
              AND (:subgroupId IS NULL OR gm.subgroup.id = :subgroupId)
            """)
    Set<Long> findRecipientIdsInGroup(
            @Param("groupId") Long groupId, @Param("subgroupId") Long subgroupId);
}
