package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComUserRepository extends JpaRepository<User, Long> {

    Optional<User> findByFacilityIdAndLoginIdAndDeletedFalse(String facilityId, String loginId);
}
