package com.carenmct.schedule.repository.schedule.copay;

import com.carenmct.schedule.domain.schedule.copay.NonBenefitOtherItem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NonBenefitOtherItemRepository extends JpaRepository<NonBenefitOtherItem, Long> {

    List<NonBenefitOtherItem> findByNonBenefitIdIn(Collection<Long> nonBenefitIds);

    List<NonBenefitOtherItem> findByNonBenefitIdOrderBySortOrderAscLabelAsc(Long nonBenefitId);

    void deleteByNonBenefitId(Long nonBenefitId);

    void deleteByNonBenefitIdAndLabel(Long nonBenefitId, String label);

    @Modifying
    @Query("DELETE FROM NonBenefitOtherItem i WHERE i.label = :label AND i.nonBenefitId IN :nonBenefitIds")
    void deleteByLabelAndNonBenefitIdIn(@Param("label") String label, @Param("nonBenefitIds") Collection<Long> nonBenefitIds);
}
