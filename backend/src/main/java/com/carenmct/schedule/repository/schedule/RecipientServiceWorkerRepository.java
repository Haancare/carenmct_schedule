package com.carenmct.schedule.repository.schedule;

import com.carenmct.schedule.domain.schedule.RecipientServiceWorker;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipientServiceWorkerRepository extends JpaRepository<RecipientServiceWorker, Long> {

    List<RecipientServiceWorker> findByRecipientIdOrderByServiceTypeAscSortOrderAsc(Long recipientId);

    @Modifying
    @Query("delete from RecipientServiceWorker r where r.recipientId = :recipientId")
    void deleteByRecipientId(@Param("recipientId") Long recipientId);

    List<RecipientServiceWorker> findByRecipientIdAndServiceTypeIn(
            Long recipientId, Collection<ServiceType> serviceTypes);
}
