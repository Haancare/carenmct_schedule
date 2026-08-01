import type { ScheduleEntry, UiRecipient, UiWorker } from "./utils/helpers";

/** 중첩 컴포넌트가 동기적으로 조회하는 모듈 캐시 (부모 setState와 함께 갱신) */
export let socialWorkers: UiWorker[] = [];
export let recipients: UiRecipient[] = [];

const scheduleCache = new Map<string, ScheduleEntry[]>();

export function syncWorkers(list: UiWorker[]) {
  socialWorkers = list;
}

export function syncRecipients(list: UiRecipient[]) {
  recipients = list;
}

export function setSchedulesForRecipient(
  recipientId: string,
  year: number,
  month: number,
  list: ScheduleEntry[],
) {
  scheduleCache.set(`${recipientId}:${year}:${month}`, list);
}

export function getSchedulesForRecipient(
  recipientId: string,
  year: number,
  month: number,
): ScheduleEntry[] {
  return scheduleCache.get(`${recipientId}:${year}:${month}`) ?? [];
}

export function getCareWorker(id: string): UiWorker | undefined {
  return socialWorkers.find((s) => s.id === id);
}

export function getRecipient(id: string): UiRecipient | undefined {
  return recipients.find((r) => r.id === id);
}
