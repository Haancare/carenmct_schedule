package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.Recipient;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComRecipientRepository extends JpaRepository<Recipient, Long>, ComRecipientRepositoryCustom {

    Optional<Recipient> findByIdAndFacility_Id(Long id, String facilityId);

    Optional<Recipient> findByFacility_IdAndNameAndCertNo(String facilityId, String name, String certNo);

    Optional<Recipient> findFirstByFacility_IdAndCertNo(String facilityId, String certNo);
}
