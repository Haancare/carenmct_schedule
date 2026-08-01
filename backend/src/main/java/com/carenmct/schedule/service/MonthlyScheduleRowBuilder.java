package com.carenmct.schedule.service;

import com.carenmct.schedule.domain.schedule.ServiceSchedule;
import com.carenmct.schedule.domain.schedule.enums.ScheduleKind;
import com.carenmct.schedule.domain.schedule.enums.ServiceType;
import com.carenmct.schedule.dto.paymentassignment.MonthlyScheduleRowDto;
import com.carenmct.schedule.dto.paymentassignment.PaymentAssignmentRecipientDto;
import java.text.Collator;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 프론트 {@code buildMonthlyScheduleRows} 와 동일 규칙 */
final class MonthlyScheduleRowBuilder {

    private static final List<ServiceType> SVC_ORDER = List.of(
            ServiceType.visit_care,
            ServiceType.family_care,
            ServiceType.full_day_visit,
            ServiceType.visit_bath,
            ServiceType.visit_nursing,
            ServiceType.day_care);

    private static final Collator KOREAN = Collator.getInstance(Locale.KOREAN);
    private static final Pattern GRADE_NUM = Pattern.compile("^(\\d)");

    private MonthlyScheduleRowBuilder() {}

    static List<MonthlyScheduleRowDto> build(
            List<PaymentAssignmentRecipientDto> recipients,
            List<ServiceSchedule> schedules,
            int year,
            int month,
            ScheduleKind scheduleKind) {

        List<MonthlyScheduleRowDto> out = new ArrayList<>();
        String prefix = String.format("%d-%02d", year, month);

        for (PaymentAssignmentRecipientDto recipient : recipients) {
            int startIdx = out.size();
            int fbGrade = parseGradeNum(recipient.gradeText());
            String fbRed = recipient.reduction();

            List<ServiceSchedule> scheds = schedules.stream()
                    .filter(s -> String.valueOf(s.getRecipientId()).equals(recipient.id()))
                    .filter(s -> s.getServiceDate().toString().startsWith(prefix))
                    .filter(s -> s.getScheduleKind() == scheduleKind)
                    .toList();

            if (scheds.isEmpty()) {
                out.add(new MonthlyScheduleRowDto(
                        recipient,
                        recipient.id() + "::none",
                        null,
                        null,
                        null,
                        List.of(),
                        0,
                        0,
                        true,
                        1,
                        true,
                        1));
            } else {
                Map<String, RowGroup> groups = new LinkedHashMap<>();

                for (ServiceSchedule schedule : scheds) {
                    int gradeNum = schedule.getGradeSnapshot() != null
                            ? parseGradeNum(schedule.getGradeSnapshot())
                            : fbGrade;
                    String reduction = schedule.getReductionSnapshot() != null
                            ? schedule.getReductionSnapshot()
                            : fbRed;
                    String key = schedule.getServiceType() + "|" + gradeNum + "|" + reduction;

                    RowGroup group = groups.computeIfAbsent(key, ignored -> new RowGroup(
                            schedule.getServiceType(), gradeNum, reduction));

                    int day = schedule.getServiceDate().getDayOfMonth();
                    group.days.add(day);
                    group.totalMinutes += schedule.getDurationMinutes();
                    group.count += 1;
                }

                List<RowGroup> items = new ArrayList<>(groups.values());
                items.sort(compareGroups());

                for (int i = 0; i < items.size(); i++) {
                    RowGroup group = items.get(i);
                    boolean firstOfPeriod = i == 0 || !items.get(i - 1).serviceType.equals(group.serviceType);
                    List<Integer> days = group.days.stream().sorted().toList();

                    out.add(new MonthlyScheduleRowDto(
                            recipient,
                            recipient.id() + "::" + group.serviceType + "|" + group.gradeNum + "|" + group.reduction,
                            group.serviceType,
                            group.gradeNum,
                            group.reduction,
                            days,
                            group.totalMinutes,
                            group.count,
                            i == 0,
                            1,
                            firstOfPeriod,
                            1));
                }
            }

            int recRowSpan = out.size() - startIdx;
            MonthlyScheduleRowDto first = out.get(startIdx);
            out.set(startIdx, copyWithRecRowSpan(first, recRowSpan));

            int periodStart = startIdx;
            for (int i = startIdx + 1; i <= out.size(); i++) {
                if (i == out.size() || out.get(i).firstOfPeriod()) {
                    int periodRowSpan = i - periodStart;
                    MonthlyScheduleRowDto periodFirst = out.get(periodStart);
                    out.set(periodStart, copyWithPeriodRowSpan(periodFirst, periodRowSpan));
                    periodStart = i;
                }
            }
        }

        return out;
    }

    private static Comparator<RowGroup> compareGroups() {
        return (a, b) -> {
            int orderA = SVC_ORDER.indexOf(a.serviceType);
            int orderB = SVC_ORDER.indexOf(b.serviceType);
            if (orderA != orderB) {
                return Integer.compare(orderA, orderB);
            }
            if (a.gradeNum != b.gradeNum) {
                return Integer.compare(a.gradeNum, b.gradeNum);
            }
            return KOREAN.compare(a.reduction, b.reduction);
        };
    }

    private static int parseGradeNum(String gradeText) {
        if (gradeText == null) {
            return 1;
        }
        Matcher matcher = GRADE_NUM.matcher(gradeText);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : 1;
    }

    private static MonthlyScheduleRowDto copyWithRecRowSpan(MonthlyScheduleRowDto row, int recRowSpan) {
        return new MonthlyScheduleRowDto(
                row.recipient(),
                row.key(),
                row.serviceType(),
                row.gradeNum(),
                row.reduction(),
                row.days(),
                row.totalMinutes(),
                row.count(),
                row.firstOfRecipient(),
                recRowSpan,
                row.firstOfPeriod(),
                row.periodRowSpan());
    }

    private static MonthlyScheduleRowDto copyWithPeriodRowSpan(MonthlyScheduleRowDto row, int periodRowSpan) {
        return new MonthlyScheduleRowDto(
                row.recipient(),
                row.key(),
                row.serviceType(),
                row.gradeNum(),
                row.reduction(),
                row.days(),
                row.totalMinutes(),
                row.count(),
                row.firstOfRecipient(),
                row.recRowSpan(),
                row.firstOfPeriod(),
                periodRowSpan);
    }

    private static final class RowGroup {
        private final ServiceType serviceType;
        private final int gradeNum;
        private final String reduction;
        private final Set<Integer> days = new TreeSet<>();
        private int totalMinutes;
        private int count;

        private RowGroup(ServiceType serviceType, int gradeNum, String reduction) {
            this.serviceType = serviceType;
            this.gradeNum = gradeNum;
            this.reduction = reduction;
        }
    }
}
