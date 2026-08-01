package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.schedule.copay.NonBenefitCharge;
import com.carenmct.schedule.domain.schedule.copay.NonBenefitFacilityCategory;
import com.carenmct.schedule.domain.schedule.copay.NonBenefitOtherItem;
import com.carenmct.schedule.dto.copayconfirmation.AddNonBenefitCategoryRequest;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationListQuery;
import com.carenmct.schedule.dto.copayconfirmation.CopayConfirmationMutationResponse;
import com.carenmct.schedule.dto.copayconfirmation.NonBenefitBulkResponse;
import com.carenmct.schedule.dto.copayconfirmation.NonBenefitCategoriesResponse;
import com.carenmct.schedule.dto.copayconfirmation.NonBenefitRecipientEntryDto;
import com.carenmct.schedule.dto.copayconfirmation.SaveNonBenefitBulkRequest;
import com.carenmct.schedule.dto.copayconfirmation.SaveNonBenefitBulkRequest.NonBenefitSaveEntryDto;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.schedule.copay.NonBenefitChargeRepository;
import com.carenmct.schedule.repository.schedule.copay.NonBenefitFacilityCategoryRepository;
import com.carenmct.schedule.repository.schedule.copay.NonBenefitOtherItemRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.service.copay.CopayNonBenefitConstants;
import com.carenmct.schedule.service.copay.CopaySegmentResolver;
import com.carenmct.schedule.service.copay.CopaySegmentTarget;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CopayNonBenefitService {

    private static final Collator KOREAN = Collator.getInstance(Locale.KOREAN);
    private static final String ACTIVE_CONTRACT = "수급중";

    private final FacilityScopeResolver facilityScope;
    private final ComRecipientRepository comRecipientRepository;
    private final NonBenefitChargeRepository nonBenefitChargeRepository;
    private final NonBenefitOtherItemRepository nonBenefitOtherItemRepository;
    private final NonBenefitFacilityCategoryRepository nonBenefitFacilityCategoryRepository;
    private final CopaySegmentResolver segmentResolver;

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public NonBenefitBulkResponse getBulk(
            int year,
            int month,
            String query,
            String status,
            String serviceType,
            String recipientId) {
        validateMonth(month);
        String facilityId = facilityScope.requireFacilityId();
        List<Recipient> recipients = resolveRecipients(facilityId, year, month, query, status, serviceType, recipientId);
        List<String> categories = loadCategoryLabels(facilityId);

        if (recipients.isEmpty()) {
            return new NonBenefitBulkResponse(year, month, categories, List.of());
        }

        List<Long> recipientIds = recipients.stream().map(Recipient::getId).toList();
        Map<Long, NonBenefitCharge> chargeByRecipient = nonBenefitChargeRepository
                .findByRecipientIdInAndServiceYearAndServiceMonth(recipientIds, year, month)
                .stream()
                .collect(Collectors.toMap(NonBenefitCharge::getRecipientId, charge -> charge));

        Map<Long, List<NonBenefitOtherItem>> otherByChargeId = loadOtherItemsByChargeId(chargeByRecipient.values());

        List<NonBenefitRecipientEntryDto> entries = recipients.stream()
                .sorted(Comparator.comparing(Recipient::getName, KOREAN))
                .map(recipient -> toEntryDto(recipient, chargeByRecipient.get(recipient.getId()), otherByChargeId, categories))
                .toList();

        return new NonBenefitBulkResponse(year, month, categories, entries);
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public CopayConfirmationMutationResponse saveBulk(SaveNonBenefitBulkRequest request) {
        validateMonth(request.month());
        if (request.entries() == null || request.entries().isEmpty()) {
            return new CopayConfirmationMutationResponse(0);
        }

        String facilityId = facilityScope.requireFacilityId();
        List<String> categories = loadCategoryLabels(facilityId);
        Set<String> allowedOtherLabels = allowedOtherLabels(categories);

        int affected = 0;
        for (NonBenefitSaveEntryDto entry : request.entries()) {
            long recipientLongId = parseLongId(entry.recipientId());
            Recipient recipient = comRecipientRepository
                    .findByIdAndFacility_Id(recipientLongId, facilityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));
            if (!ACTIVE_CONTRACT.equals(recipient.getContractStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수급중 수급자만 저장할 수 있습니다.");
            }

            int meal = Math.max(0, entry.meal());
            int room = Math.max(0, entry.room());
            int beauty = Math.max(0, entry.beauty());

            NonBenefitCharge charge = nonBenefitChargeRepository
                    .findByRecipientIdAndServiceYearAndServiceMonth(
                            recipientLongId, request.year(), request.month())
                    .map(existing -> {
                        existing.updateFixedAmounts(meal, room, beauty);
                        return existing;
                    })
                    .orElseGet(() -> nonBenefitChargeRepository.save(NonBenefitCharge.create(
                            recipientLongId, request.year(), request.month(), meal, room, beauty)));

            syncOtherItems(charge.getId(), entry.otherAmounts(), allowedOtherLabels);
            affected++;
        }

        return new CopayConfirmationMutationResponse(affected);
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public NonBenefitCategoriesResponse getCategories() {
        String facilityId = facilityScope.requireFacilityId();
        return new NonBenefitCategoriesResponse(loadCategoryLabels(facilityId));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public NonBenefitCategoriesResponse addCategory(AddNonBenefitCategoryRequest request) {
        String facilityId = facilityScope.requireFacilityId();
        String label = normalizeLabel(request.label());
        validateNewCategoryLabel(facilityId, label);

        long count = nonBenefitFacilityCategoryRepository.countByFacilityId(facilityId);
        if (count >= CopayNonBenefitConstants.MAX_FACILITY_OTHER_CATEGORIES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "기타 카테고리는 최대 "
                            + CopayNonBenefitConstants.MAX_FACILITY_OTHER_CATEGORIES
                            + "개까지 등록할 수 있습니다.");
        }

        nonBenefitFacilityCategoryRepository.save(
                NonBenefitFacilityCategory.create(facilityId, label, (int) count));
        return new NonBenefitCategoriesResponse(loadCategoryLabels(facilityId));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public NonBenefitCategoriesResponse deleteCategory(String label) {
        String facilityId = facilityScope.requireFacilityId();
        String normalized = normalizeLabel(label);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "label 이 필요합니다.");
        }
        if (CopayNonBenefitConstants.DEFAULT_OTHER_LABEL.equals(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기본 '기타' 항목은 삭제할 수 없습니다.");
        }

        if (!nonBenefitFacilityCategoryRepository.existsByFacilityIdAndLabel(facilityId, normalized)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다.");
        }

        List<Long> recipientIds = comRecipientRepository.findByFacilityId(facilityId, null).stream()
                .map(Recipient::getId)
                .toList();
        if (!recipientIds.isEmpty()) {
            List<Long> chargeIds = nonBenefitChargeRepository.findIdsByRecipientIdIn(recipientIds);
            if (!chargeIds.isEmpty()) {
                nonBenefitOtherItemRepository.deleteByLabelAndNonBenefitIdIn(normalized, chargeIds);
            }
        }

        nonBenefitFacilityCategoryRepository.deleteByFacilityIdAndLabel(facilityId, normalized);
        return new NonBenefitCategoriesResponse(loadCategoryLabels(facilityId));
    }

    private List<Recipient> resolveRecipients(
            String facilityId,
            int year,
            int month,
            String query,
            String status,
            String serviceType,
            String recipientId) {
        if (StringUtils.hasText(recipientId)) {
            Recipient recipient = comRecipientRepository
                    .findByIdAndFacility_Id(parseLongId(recipientId), facilityId)
                    .orElse(null);
            if (recipient == null || !ACTIVE_CONTRACT.equals(recipient.getContractStatus())) {
                return List.of();
            }
            return List.of(recipient);
        }

        CopayConfirmationListQuery listQuery = new CopayConfirmationListQuery(
                year,
                month,
                query,
                CopayConfirmationListQuery.parseStatus(status),
                CopayConfirmationListQuery.parseServiceType(serviceType));

        List<CopaySegmentTarget> targets = segmentResolver.resolveTargets(facilityId, listQuery, null);
        LinkedHashSet<Long> seen = new LinkedHashSet<>();
        List<Recipient> recipients = new ArrayList<>();
        for (CopaySegmentTarget target : targets) {
            if (seen.add(target.recipient().getId())) {
                recipients.add(target.recipient());
            }
        }
        return recipients;
    }

    private List<String> loadCategoryLabels(String facilityId) {
        return nonBenefitFacilityCategoryRepository.findByFacilityIdOrderBySortOrderAscLabelAsc(facilityId).stream()
                .map(NonBenefitFacilityCategory::getLabel)
                .toList();
    }

    private static Set<String> allowedOtherLabels(List<String> facilityCategories) {
        Set<String> labels = new LinkedHashSet<>();
        labels.add(CopayNonBenefitConstants.DEFAULT_OTHER_LABEL);
        labels.addAll(facilityCategories);
        return labels;
    }

    private Map<Long, List<NonBenefitOtherItem>> loadOtherItemsByChargeId(Iterable<NonBenefitCharge> charges) {
        List<Long> chargeIds = new ArrayList<>();
        charges.forEach(charge -> chargeIds.add(charge.getId()));
        if (chargeIds.isEmpty()) {
            return Map.of();
        }
        return nonBenefitOtherItemRepository.findByNonBenefitIdIn(chargeIds).stream()
                .collect(Collectors.groupingBy(NonBenefitOtherItem::getNonBenefitId));
    }

    private NonBenefitRecipientEntryDto toEntryDto(
            Recipient recipient,
            NonBenefitCharge charge,
            Map<Long, List<NonBenefitOtherItem>> otherByChargeId,
            List<String> facilityCategories) {
        int meal = charge != null ? charge.getMealAmount() : 0;
        int room = charge != null ? charge.getRoomAmount() : 0;
        int beauty = charge != null ? charge.getBeautyAmount() : 0;

        Map<String, Integer> otherAmounts = new LinkedHashMap<>();
        otherAmounts.put(CopayNonBenefitConstants.DEFAULT_OTHER_LABEL, 0);
        for (String category : facilityCategories) {
            otherAmounts.put(category, 0);
        }

        if (charge != null) {
            List<NonBenefitOtherItem> items = otherByChargeId.getOrDefault(charge.getId(), List.of());
            for (NonBenefitOtherItem item : items) {
                if (item.getAmount() > 0) {
                    otherAmounts.put(item.getLabel(), item.getAmount());
                }
            }
        }

        int otherSum = otherAmounts.values().stream().mapToInt(Integer::intValue).sum();
        int total = meal + room + beauty + otherSum;

        return new NonBenefitRecipientEntryDto(
                String.valueOf(recipient.getId()),
                recipient.getName(),
                recipient.getGrade(),
                meal,
                room,
                beauty,
                otherAmounts,
                total);
    }

    private void syncOtherItems(Long chargeId, Map<String, Integer> otherAmounts, Set<String> allowedLabels) {
        if (otherAmounts == null) {
            otherAmounts = Map.of();
        }

        nonBenefitOtherItemRepository.deleteByNonBenefitId(chargeId);

        int sort = 0;
        for (String label : allowedLabels) {
            int amount = Math.max(0, otherAmounts.getOrDefault(label, 0));
            if (amount <= 0) {
                continue;
            }
            nonBenefitOtherItemRepository.save(
                    NonBenefitOtherItem.create(chargeId, label, amount, sort++));
        }
    }

    private void validateNewCategoryLabel(String facilityId, String label) {
        if (!StringUtils.hasText(label)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리명을 입력하세요.");
        }
        if (CopayNonBenefitConstants.DEFAULT_OTHER_LABEL.equals(label)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'기타'는 기본 항목이라 별도 등록할 수 없습니다.");
        }
        if (nonBenefitFacilityCategoryRepository.existsByFacilityIdAndLabel(facilityId, label)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 카테고리입니다.");
        }
    }

    private static String normalizeLabel(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void validateMonth(int month) {
        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "month must be 1-12");
        }
    }

    private static long parseLongId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid id: " + value);
        }
    }
}
