package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.reference.AnnualBenefitLimit;
import com.carenmct.schedule.dto.admin.AnnualBenefitLimitDto;
import com.carenmct.schedule.dto.admin.UpsertAnnualBenefitLimitRequest;
import com.carenmct.schedule.repository.schedule.reference.AnnualBenefitLimitRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminAnnualBenefitLimitService {

    /** 피그마 기본값 (데이터가 하나도 없을 때 새 연도 생성용) */
    private static final int[] DEFAULT_LIMITS = {
        2_512_900, 2_331_200, 1_528_200, 1_409_700, 1_208_900, 676_320
    };

    private final AnnualBenefitLimitRepository benefitLimitRepository;

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public List<AnnualBenefitLimitDto> list() {
        return benefitLimitRepository.findAllByOrderByBenefitYearDesc().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true, transactionManager = "scheduleTransactionManager")
    public AnnualBenefitLimitDto get(int year) {
        return benefitLimitRepository
                .findByBenefitYear(year)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Benefit limit not found for year " + year));
    }

    @Transactional(transactionManager = "scheduleTransactionManager")
    public AnnualBenefitLimitDto upsert(int year, UpsertAnnualBenefitLimitRequest request) {
        validateYear(year);
        AnnualBenefitLimit row = benefitLimitRepository
                .findByBenefitYear(year)
                .orElse(null);
        if (row == null) {
            row = AnnualBenefitLimit.create(
                    year,
                    request.limitGrade1(),
                    request.limitGrade2(),
                    request.limitGrade3(),
                    request.limitGrade4(),
                    request.limitGrade5(),
                    request.limitGradeCognitive(),
                    blankToNull(request.note()));
        } else {
            row.updateLimits(
                    request.limitGrade1(),
                    request.limitGrade2(),
                    request.limitGrade3(),
                    request.limitGrade4(),
                    request.limitGrade5(),
                    request.limitGradeCognitive(),
                    blankToNull(request.note()));
        }
        return toDto(benefitLimitRepository.save(row));
    }

    /** 최신 연도+1 생성 (없으면 현재 연도, 한도는 최신 행 또는 기본값 복사) */
    @Transactional(transactionManager = "scheduleTransactionManager")
    public AnnualBenefitLimitDto createNextYear() {
        List<AnnualBenefitLimit> all = benefitLimitRepository.findAllByOrderByBenefitYearDesc();
        int nextYear;
        int g1;
        int g2;
        int g3;
        int g4;
        int g5;
        int gCog;
        if (all.isEmpty()) {
            nextYear = java.time.Year.now().getValue();
            g1 = DEFAULT_LIMITS[0];
            g2 = DEFAULT_LIMITS[1];
            g3 = DEFAULT_LIMITS[2];
            g4 = DEFAULT_LIMITS[3];
            g5 = DEFAULT_LIMITS[4];
            gCog = DEFAULT_LIMITS[5];
        } else {
            AnnualBenefitLimit latest = all.get(0);
            nextYear = latest.getBenefitYear() + 1;
            g1 = latest.getLimitGrade1();
            g2 = latest.getLimitGrade2();
            g3 = latest.getLimitGrade3();
            g4 = latest.getLimitGrade4();
            g5 = latest.getLimitGrade5();
            gCog = latest.getLimitGradeCognitive();
        }
        if (benefitLimitRepository.existsByBenefitYear(nextYear)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Benefit limit already exists for year " + nextYear);
        }
        AnnualBenefitLimit created = AnnualBenefitLimit.create(
                nextYear, g1, g2, g3, g4, g5, gCog, null);
        return toDto(benefitLimitRepository.save(created));
    }

    private AnnualBenefitLimitDto toDto(AnnualBenefitLimit row) {
        return new AnnualBenefitLimitDto(
                row.getId(),
                row.getBenefitYear(),
                row.getLimitGrade1(),
                row.getLimitGrade2(),
                row.getLimitGrade3(),
                row.getLimitGrade4(),
                row.getLimitGrade5(),
                row.getLimitGradeCognitive(),
                row.getNote());
    }

    private static void validateYear(int year) {
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid benefit year");
        }
    }

    private static String blankToNull(String note) {
        if (note == null || note.isBlank()) {
            return null;
        }
        return note.trim();
    }
}
