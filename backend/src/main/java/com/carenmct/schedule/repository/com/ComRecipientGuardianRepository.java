package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.RecipientGuardian;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComRecipientGuardianRepository extends JpaRepository<RecipientGuardian, Long> {

    List<RecipientGuardian> findByRecipient_IdOrderBySortOrderAsc(Long recipientId);
}
