package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.ComGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComGroupRepository extends JpaRepository<ComGroup, Long> {

    List<ComGroup> findByFacility_IdAndTypeOrderByNameAsc(String facilityId, String type);

    Optional<ComGroup> findByIdAndFacility_Id(Long id, String facilityId);
}
