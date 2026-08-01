package com.carenmct.schedule.repository.schedule.copay;

import com.carenmct.schedule.domain.schedule.copay.NonBenefitCharge;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NonBenefitChargeRepository extends JpaRepository<NonBenefitCharge, Long> {

    List<NonBenefitCharge> findByRecipientIdInAndServiceYearAndServiceMonth(
            List<Long> recipientIds, int serviceYear, int serviceMonth);

    Optional<NonBenefitCharge> findByRecipientIdAndServiceYearAndServiceMonth(
            Long recipientId, int serviceYear, int serviceMonth);

    @Query("SELECT c.id FROM NonBenefitCharge c WHERE c.recipientId IN :recipientIds")
    List<Long> findIdsByRecipientIdIn(@Param("recipientIds") Collection<Long> recipientIds);
}
