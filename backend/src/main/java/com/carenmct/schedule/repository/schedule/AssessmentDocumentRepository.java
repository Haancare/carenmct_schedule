package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.AssessmentDocument;
import com.carenmct.schedule.domain.schedule.enums.AssessmentDocType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssessmentDocumentRepository extends JpaRepository<AssessmentDocument, Long> {

    Optional<AssessmentDocument> findByIdAndFacilityIdAndDeletedAtIsNull(Long id, String facilityId);

    List<AssessmentDocument>
            findByFacilityIdAndRecipientIdAndDocTypeAndDeletedAtIsNullOrderByWrittenDateDescIdDesc(
                    String facilityId, Long recipientId, AssessmentDocType docType);

    @Query(
            """
            select d.recipientId, d.docType, max(d.writtenDate)
            from AssessmentDocument d
            where d.facilityId = :facilityId
              and d.deletedAt is null
            group by d.recipientId, d.docType
            """)
    List<Object[]> findLatestWrittenDatesByFacility(@Param("facilityId") String facilityId);
}
