package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.WorkJournal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkJournalRepository extends JpaRepository<WorkJournal, Long> {

    Optional<WorkJournal> findByIdAndFacilityIdAndDeletedAtIsNull(Long id, String facilityId);

    Optional<WorkJournal> findByFacilityIdAndConsultationVisitIdAndDeletedAtIsNull(
            String facilityId, Long consultationVisitId);

    List<WorkJournal> findByFacilityIdAndConsultationVisitIdInAndDeletedAtIsNull(
            String facilityId, Collection<Long> visitIds);

    List<WorkJournal> findByFacilityIdAndRecipientIdAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
            String facilityId, Long recipientId);

    List<WorkJournal> findByFacilityIdAndRecipientIdAndWrittenDateBetweenAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
            String facilityId, Long recipientId, LocalDate from, LocalDate to);
}
