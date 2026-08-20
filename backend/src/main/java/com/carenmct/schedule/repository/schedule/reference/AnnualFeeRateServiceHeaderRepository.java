package com.carenmct.schedule.repository.schedule.reference;

import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.domain.schedule.reference.AnnualFeeRateServiceHeader;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnnualFeeRateServiceHeaderRepository extends JpaRepository<AnnualFeeRateServiceHeader, Long> {

    @Query(
            """
            SELECT h FROM AnnualFeeRateServiceHeader h
            LEFT JOIN FETCH h.items
            WHERE h.benefitYear = :year AND h.serviceType = :serviceType
            """)
    Optional<AnnualFeeRateServiceHeader> findWithItemsByYearAndServiceType(
            @Param("year") int year, @Param("serviceType") ServiceType serviceType);

    @Query(
            """
            SELECT DISTINCT h.benefitYear FROM AnnualFeeRateServiceHeader h
            ORDER BY h.benefitYear DESC
            """)
    List<Integer> findDistinctBenefitYears();

    @Query(
            """
            SELECT DISTINCT h FROM AnnualFeeRateServiceHeader h
            LEFT JOIN FETCH h.items
            WHERE h.benefitYear = :year
            """)
    List<AnnualFeeRateServiceHeader> findAllWithItemsByYear(@Param("year") int year);

    boolean existsByBenefitYear(int benefitYear);
}
