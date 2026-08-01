import apiClient from "@/lib/api/client";

export interface HolidayDto {
  date: string;
  name: string;
  type: string;
}

const cache = new Map<number, Set<string>>();
const nameCache = new Map<number, Map<string, string>>();
const loadPromises = new Map<number, Promise<Set<string>>>();

export async function ensureHolidaysLoaded(year: number): Promise<Set<string>> {
  if (cache.has(year)) {
    return cache.get(year)!;
  }
  const pending = loadPromises.get(year);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    try {
      const { data } = await apiClient.get<HolidayDto[]>(
        "/api/schedule-assignment/holidays",
        { params: { year } },
      );
      const dates = new Set(data.map((h) => h.date));
      const names = new Map(data.map((h) => [h.date, h.name]));
      cache.set(year, dates);
      nameCache.set(year, names);
      return dates;
    } catch {
      const empty = new Set<string>();
      cache.set(year, empty);
      nameCache.set(year, new Map());
      return empty;
    } finally {
      loadPromises.delete(year);
    }
  })();

  loadPromises.set(year, promise);
  return promise;
}

export function getHolidayDateSet(year: number): Set<string> {
  return cache.get(year) ?? new Set();
}

export function getHolidayName(year: number, dateStr: string): string | undefined {
  return nameCache.get(year)?.get(dateStr);
}

export function isHolidayDate(
  dateStr: string,
  holidayDates: ReadonlySet<string>,
): boolean {
  return holidayDates.has(dateStr);
}

export function resetHolidayCache() {
  cache.clear();
  nameCache.clear();
  loadPromises.clear();
}
