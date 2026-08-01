package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Facility;
import com.carenmct.schedule.dto.session.CurrentFacilityDto;
import com.carenmct.schedule.repository.com.ComFacilityRepository;
import com.carenmct.schedule.repository.com.ComFacilitySubCategoryRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true, transactionManager = "comTransactionManager")
public class SessionService {

    private final FacilityScopeResolver facilityScope;
    private final ComFacilityRepository comFacilityRepository;
    private final ComFacilitySubCategoryRepository comFacilitySubCategoryRepository;

    public CurrentFacilityDto getCurrentFacility() {
        String facilityId = facilityScope.requireFacilityId();
        Facility facility = comFacilityRepository
                .findById(facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));

        List<String> subCategories = comFacilitySubCategoryRepository
                .findByFacilityIdOrderBySortOrderAsc(facilityId)
                .stream()
                .map(item -> item.getCategory())
                .toList();

        return new CurrentFacilityDto(
                facility.getId(),
                facility.getName(),
                facility.getAlias(),
                facility.getCode(),
                facility.getCategory(),
                subCategories,
                facility.getUniqueNum());
    }
}
