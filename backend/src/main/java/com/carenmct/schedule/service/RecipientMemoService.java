package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.com.Recipient;
import com.carenmct.schedule.domain.com.RecipientMemo;
import com.carenmct.schedule.domain.com.User;
import com.carenmct.schedule.dto.scheduleassignment.CreateRecipientMemoRequest;
import com.carenmct.schedule.dto.scheduleassignment.RecipientMemoDto;
import com.carenmct.schedule.dto.scheduleassignment.UpdateRecipientMemoRequest;
import com.carenmct.schedule.repository.com.ComRecipientMemoRepository;
import com.carenmct.schedule.repository.com.ComRecipientRepository;
import com.carenmct.schedule.repository.com.ComUserRepository;
import com.carenmct.schedule.security.FacilityScopeResolver;
import com.carenmct.schedule.security.JwtUserPrincipal;
import com.carenmct.schedule.security.UserScope;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RecipientMemoService {

    private final ComRecipientMemoRepository recipientMemoRepository;
    private final ComRecipientRepository comRecipientRepository;
    private final ComUserRepository comUserRepository;
    private final FacilityScopeResolver facilityScope;

    @Transactional(readOnly = true, transactionManager = "comTransactionManager")
    public List<RecipientMemoDto> listMemos(String recipientId) {
        long recipientLongId = parseRecipientId(recipientId);
        requireRecipient(recipientLongId);
        return recipientMemoRepository.findMemosByRecipient(recipientLongId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(transactionManager = "comTransactionManager")
    public RecipientMemoDto createMemo(String recipientId, CreateRecipientMemoRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        String facilityId = facilityScope.requireFacilityId();
        long recipientLongId = parseRecipientId(recipientId);
        Recipient recipient = comRecipientRepository
                .findByIdAndFacility_Id(recipientLongId, facilityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        User author = requireCurrentAuthor(facilityId);

        RecipientMemo memo = RecipientMemo.create(recipient, author, request.content(), null, false);
        return toDto(recipientMemoRepository.save(memo));
    }

    @Transactional(transactionManager = "comTransactionManager")
    public RecipientMemoDto updateMemo(Long memoId, UpdateRecipientMemoRequest request) {
        if (request.content() == null || request.content().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "content is required");
        }
        RecipientMemo memo = requireMemo(memoId);
        memo.updateContent(request.content());
        return toDto(memo);
    }

    @Transactional(transactionManager = "comTransactionManager")
    public RecipientMemoDto togglePin(Long memoId) {
        RecipientMemo memo = requireMemo(memoId);
        memo.togglePinned();
        return toDto(memo);
    }

    @Transactional(transactionManager = "comTransactionManager")
    public void deleteMemo(Long memoId) {
        RecipientMemo memo = requireMemo(memoId);
        memo.softDelete();
    }

    private RecipientMemo requireMemo(Long memoId) {
        String facilityId = facilityScope.requireFacilityId();
        RecipientMemo memo = recipientMemoRepository
                .findById(memoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Memo not found"));
        if (memo.getDeletedAt() != null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Memo not found");
        }
        Long recipientId = memo.getRecipient().getId();
        if (comRecipientRepository.findByIdAndFacility_Id(recipientId, facilityId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Memo not found");
        }
        return memo;
    }

    private void requireRecipient(long recipientLongId) {
        String facilityId = facilityScope.requireFacilityId();
        if (comRecipientRepository.findByIdAndFacility_Id(recipientLongId, facilityId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found");
        }
    }

    private static long parseRecipientId(String recipientId) {
        try {
            return Long.parseLong(recipientId);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid recipientId");
        }
    }

    private User requireCurrentAuthor(String facilityId) {
        Long userId = UserScope.currentUserIdOrNull();
        if (userId != null) {
            return comUserRepository
                    .findById(userId)
                    .filter(user -> facilityId.equals(user.getFacilityId()))
                    .filter(user -> !Boolean.TRUE.equals(user.getDeleted()))
                    .orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Author user not found"));
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal jwtUser) {
            return comUserRepository
                    .findByFacilityIdAndLoginIdAndDeletedFalse(facilityId, jwtUser.loginId())
                    .orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Author user not found"));
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    private RecipientMemoDto toDto(RecipientMemo memo) {
        String authorName = memo.getAuthor() != null ? memo.getAuthor().getName() : "-";
        return new RecipientMemoDto(
                String.valueOf(memo.getId()),
                memo.getContent(),
                memo.getCreatedAt().toString(),
                authorName,
                memo.getServiceMonth(),
                Boolean.TRUE.equals(memo.getPinned()));
    }
}
