package com.carenmct.schedule.repository.com;

import com.carenmct.schedule.domain.com.QRecipient;
import com.carenmct.schedule.domain.com.QRecipientAssignedWorker;
import com.carenmct.schedule.domain.com.Recipient;
import com.querydsl.core.Tuple;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
public class ComRecipientRepositoryImpl implements ComRecipientRepositoryCustom {

    private static final QRecipient recipient = QRecipient.recipient;
    private static final QRecipientAssignedWorker assignedWorker = QRecipientAssignedWorker.recipientAssignedWorker;

    private final JPAQueryFactory queryFactory;

    public ComRecipientRepositoryImpl(@Qualifier("comJpaQueryFactory") JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<Recipient> findByFacilityId(String facilityId, String nameQuery) {
        BooleanBuilder where = new BooleanBuilder(recipient.facility.id.eq(facilityId));
        if (StringUtils.hasText(nameQuery)) {
            where.and(recipient.name.contains(nameQuery.trim()));
        }

        return queryFactory
                .selectFrom(recipient)
                .where(where)
                .orderBy(recipient.name.asc())
                .fetch();
    }

    @Override
    public Map<Long, List<Long>> findAssignedEmployeeIdsByRecipientIds(Collection<Long> recipientIds) {
        if (recipientIds == null || recipientIds.isEmpty()) {
            return Map.of();
        }

        List<Tuple> rows = queryFactory
                .select(assignedWorker.recipient.id, assignedWorker.employee.id)
                .from(assignedWorker)
                .where(assignedWorker.recipient.id.in(recipientIds))
                .fetch();

        return rows.stream()
                .collect(Collectors.groupingBy(
                        tuple -> tuple.get(assignedWorker.recipient.id),
                        Collectors.mapping(tuple -> tuple.get(assignedWorker.employee.id), Collectors.toList())));
    }

    @Override
    public Map<Long, List<Long>> findAssignedEmployeeIdsByFacilityId(String facilityId) {
        if (!StringUtils.hasText(facilityId)) {
            return Map.of();
        }

        List<Tuple> rows = queryFactory
                .select(assignedWorker.recipient.id, assignedWorker.employee.id)
                .from(assignedWorker)
                .join(assignedWorker.recipient, recipient)
                .where(recipient.facility.id.eq(facilityId))
                .fetch();

        return rows.stream()
                .collect(Collectors.groupingBy(
                        tuple -> tuple.get(assignedWorker.recipient.id),
                        Collectors.mapping(tuple -> tuple.get(assignedWorker.employee.id), Collectors.toList())));
    }
}
