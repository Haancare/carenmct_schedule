package com.carenmct.schedule.repository.schedule.copay;

import com.carenmct.schedule.domain.schedule.copay.CopayConfirmation;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CopayConfirmationRepository extends JpaRepository<CopayConfirmation, Long> {

    List<CopayConfirmation> findByFacilityIdAndServiceYear(String facilityId, int serviceYear);

    List<CopayConfirmation> findByFacilityIdAndServiceYearAndServiceMonth(
            String facilityId, int serviceYear, int serviceMonth);

    List<CopayConfirmation> findByRecipientIdAndServiceYearAndServiceMonth(
            Long recipientId, int serviceYear, int serviceMonth);

    Optional<CopayConfirmation> findByRecipientIdAndServiceYearAndServiceMonthAndServiceTypeAndPeriodKey(
            Long recipientId,
            int serviceYear,
            int serviceMonth,
            ServiceType serviceType,
            String periodKey);

    void deleteByRecipientIdAndServiceYearAndServiceMonthAndServiceTypeAndPeriodKey(
            Long recipientId,
            int serviceYear,
            int serviceMonth,
            ServiceType serviceType,
            String periodKey);
}
