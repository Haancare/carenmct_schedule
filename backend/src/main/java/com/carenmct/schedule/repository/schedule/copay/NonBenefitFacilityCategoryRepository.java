package com.carenmct.schedule.repository.schedule.copay;

import com.carenmct.schedule.domain.schedule.copay.NonBenefitFacilityCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NonBenefitFacilityCategoryRepository
        extends JpaRepository<NonBenefitFacilityCategory, Long> {

    List<NonBenefitFacilityCategory> findByFacilityIdOrderBySortOrderAscLabelAsc(String facilityId);

    long countByFacilityId(String facilityId);

    boolean existsByFacilityIdAndLabel(String facilityId, String label);

    void deleteByFacilityIdAndLabel(String facilityId, String label);
}
