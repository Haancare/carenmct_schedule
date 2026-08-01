package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.QRecipientMemo;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

@Repository
public class ComRecipientMemoRepositoryImpl implements ComRecipientMemoRepositoryCustom {

    private static final QRecipientMemo memo = QRecipientMemo.recipientMemo;

    private final JPAQueryFactory queryFactory;

    public ComRecipientMemoRepositoryImpl(@Qualifier("comJpaQueryFactory") JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public Map<String, String> findDayMemosByRecipientAndYear(Long recipientId, int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to = LocalDate.of(year, 12, 31);

        var rows = queryFactory
                .select(memo.createdAt, memo.content)
                .from(memo)
                .where(
                        memo.recipient.id.eq(recipientId),
                        memo.deletedAt.isNull(),
                        memo.createdAt.goe(from.atStartOfDay()),
                        memo.createdAt.loe(to.atTime(23, 59, 59)))
                .orderBy(memo.createdAt.asc())
                .fetch();

        Map<String, String> dayMemos = new LinkedHashMap<>();
        for (var row : rows) {
            String dateKey = row.get(memo.createdAt).toLocalDate().toString();
            dayMemos.put(dateKey, row.get(memo.content));
        }
        return dayMemos;
    }

    @Override
    public java.util.List<com.carenmct.schedule.domain.com.RecipientMemo> findMemosByRecipient(
            Long recipientId) {
        return queryFactory
                .selectFrom(memo)
                .leftJoin(memo.author).fetchJoin()
                .where(memo.recipient.id.eq(recipientId), memo.deletedAt.isNull())
                .orderBy(memo.pinned.desc(), memo.createdAt.desc())
                .fetch();
    }
}
