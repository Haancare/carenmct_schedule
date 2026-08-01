import type { ScheduleAssignmentListItem } from "@/lib/api/scheduleAssignment.types";

/** 수급자 경로 전환 시 페이지 리마운트되어도 목록·스크롤 유지 */
type ListCache = {
  key: string;
  items: ScheduleAssignmentListItem[];
  scrollTop: number;
  showAllActive: boolean;
};

let cache: ListCache | null = null;

export function listCacheKey(
  year: number,
  month: number,
  showAllActive: boolean,
): string {
  return `${year}|${month}|${showAllActive ? 1 : 0}`;
}

export function readListCache(key: string): ListCache | null {
  return cache?.key === key ? cache : null;
}

export function writeListItems(
  key: string,
  items: ScheduleAssignmentListItem[],
  showAllActive: boolean,
): void {
  cache = {
    key,
    items,
    scrollTop: cache?.key === key ? cache.scrollTop : (cache?.scrollTop ?? 0),
    showAllActive,
  };
}

export function getListScrollTop(): number {
  return cache?.scrollTop ?? 0;
}

export function setListScrollTop(scrollTop: number): void {
  if (!cache) {
    cache = { key: "", items: [], scrollTop, showAllActive: true };
    return;
  }
  cache.scrollTop = scrollTop;
}

export function readCachedShowAllActive(): boolean | null {
  return cache ? cache.showAllActive : null;
}

/** 일정 저장 후 왼쪽 목록 plan/claim 건수만 갱신 (목록 API 재호출 없음). 넘긴 쪽만 갱신. */
export function patchListItemCounts(
  recipientId: string,
  counts: { planCount?: number; claimCount?: number },
): ScheduleAssignmentListItem[] | null {
  if (!cache) return null;
  let changed = false;
  const items = cache.items.map((item) => {
    if (String(item.recipient.id) !== String(recipientId)) return item;
    const planCount =
      counts.planCount !== undefined ? counts.planCount : item.planCount;
    const claimCount =
      counts.claimCount !== undefined ? counts.claimCount : item.claimCount;
    if (item.planCount === planCount && item.claimCount === claimCount) return item;
    changed = true;
    return { ...item, planCount, claimCount };
  });
  if (changed) cache = { ...cache, items };
  return cache.items;
}
