package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.RecipientFamilyWorker;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComRecipientFamilyWorkerRepository extends JpaRepository<RecipientFamilyWorker, Long> {

    List<RecipientFamilyWorker> findByRecipientIdOrderBySelfCopayDeductionDescIdAsc(Long recipientId);
}
