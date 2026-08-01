package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.Employee;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComEmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByFacility_IdAndDeletedAtIsNullOrderByNameAsc(String facilityId);

    List<Employee> findByIdInAndFacility_IdAndDeletedAtIsNull(Collection<Long> ids, String facilityId);

    Optional<Employee> findFirstByFacility_IdAndNameAndDobAndDeletedAtIsNull(
            String facilityId, String name, LocalDate dob);
}
