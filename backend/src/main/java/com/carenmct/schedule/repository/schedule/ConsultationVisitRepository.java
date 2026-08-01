package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.ConsultationVisit;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationVisitRepository extends JpaRepository<ConsultationVisit, Long> {

    List<ConsultationVisit> findByFacilityIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
            String facilityId, LocalDate from, LocalDate to);

    List<ConsultationVisit> findByFacilityIdAndEmployeeIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
            String facilityId, Long employeeId, LocalDate from, LocalDate to);

    List<ConsultationVisit> findByFacilityIdAndRecipientIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
            String facilityId, Long recipientId, LocalDate from, LocalDate to);

    List<ConsultationVisit> findByFacilityIdAndEmployeeIdAndRecipientIdAndVisitDateBetweenAndDeletedAtIsNullOrderByVisitDateAscPlannedStartTimeAsc(
            String facilityId, Long employeeId, Long recipientId, LocalDate from, LocalDate to);

    Optional<ConsultationVisit> findByIdAndFacilityIdAndDeletedAtIsNull(Long id, String facilityId);
}
