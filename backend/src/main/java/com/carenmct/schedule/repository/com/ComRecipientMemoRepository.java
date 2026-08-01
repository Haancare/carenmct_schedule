package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.RecipientMemo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComRecipientMemoRepository
        extends JpaRepository<RecipientMemo, Long>, ComRecipientMemoRepositoryCustom {}
