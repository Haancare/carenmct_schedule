package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.ComGroupSubgroup;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComGroupSubgroupRepository extends JpaRepository<ComGroupSubgroup, Long> {

    List<ComGroupSubgroup> findByGroup_IdOrderBySortOrderAscNameAsc(Long groupId);
}
