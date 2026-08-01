package com.carenmct.schedule.domain.com;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QComHoliday is a Querydsl query type for ComHoliday
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QComHoliday extends EntityPathBase<ComHoliday> {

    private static final long serialVersionUID = 157477815L;

    public static final QComHoliday comHoliday = new QComHoliday("comHoliday");

    public final DatePath<java.time.LocalDate> holidayDate = createDate("holidayDate", java.time.LocalDate.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath name = createString("name");

    public final StringPath type = createString("type");

    public QComHoliday(String variable) {
        super(ComHoliday.class, forVariable(variable));
    }

    public QComHoliday(Path<? extends ComHoliday> path) {
        super(path.getType(), path.getMetadata());
    }

    public QComHoliday(PathMetadata metadata) {
        super(ComHoliday.class, metadata);
    }

}

