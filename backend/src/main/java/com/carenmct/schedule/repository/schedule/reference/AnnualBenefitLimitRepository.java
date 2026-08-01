package com.carenmct.schedule.repository.schedule.reference;

import com.carenmct.schedule.domain.schedule.reference.AnnualBenefitLimit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnnualBenefitLimitRepository extends JpaRepository<AnnualBenefitLimit, Long> {

    Optional<AnnualBenefitLimit> findByBenefitYear(int benefitYear);
}
