package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.FacilitySubCategory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComFacilitySubCategoryRepository extends JpaRepository<FacilitySubCategory, Long> {

    List<FacilitySubCategory> findByFacilityIdOrderBySortOrderAsc(String facilityId);
}
