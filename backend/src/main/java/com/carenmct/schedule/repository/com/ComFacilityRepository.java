package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComFacilityRepository extends JpaRepository<Facility, String> {}
