import type { ServiceTypeCode } from "@/lib/api/paymentAssignment.types";
import {
  fetchRecipientServiceWorkers,
  replaceRecipientServiceWorkers,
  type RecipientServiceWorkerItem,
} from "@/lib/api/scheduleAssignment";

export type AssignedStore = {
  workers: Record<string, string[]>;
  familyRelations: Record<string, string>;
};

const SERVICE_TYPES: ServiceTypeCode[] = [
  "visit_care",
  "family_care",
  "full_day_visit",
  "visit_bath",
  "visit_nursing",
];

function emptyStore(): AssignedStore {
  return { workers: {}, familyRelations: {} };
}

function itemsToStore(items: RecipientServiceWorkerItem[]): AssignedStore {
  const workers: Record<string, string[]> = {};
  const familyRelations: Record<string, string> = {};
  for (const item of items) {
    const empId = String(item.employeeId);
    const list = workers[item.serviceType] ?? [];
    if (!list.includes(empId)) list.push(empId);
    workers[item.serviceType] = list;
    if (item.serviceType === "family_care" && item.familyRelation) {
      familyRelations[empId] = item.familyRelation;
    }
  }
  return { workers, familyRelations };
}

function storeToItems(store: AssignedStore): RecipientServiceWorkerItem[] {
  const items: RecipientServiceWorkerItem[] = [];
  let sortOrder = 0;
  for (const serviceType of SERVICE_TYPES) {
    const ids = store.workers[serviceType] ?? [];
    for (const empId of ids) {
      const employeeId = Number(empId);
      if (!Number.isFinite(employeeId)) continue;
      items.push({
        serviceType,
        employeeId,
        familyRelation:
          serviceType === "family_care"
            ? (store.familyRelations[empId] ?? null)
            : null,
        sortOrder: sortOrder++,
      });
    }
  }
  return items;
}

function seedStore(seedWorkerIds: string[]): AssignedStore {
  if (seedWorkerIds.length === 0) return emptyStore();
  const workers: Record<string, string[]> = {};
  for (const svc of SERVICE_TYPES) {
    workers[svc] = [...seedWorkerIds];
  }
  return { workers, familyRelations: {} };
}

/** DB 조회. 없으면 com 담당자 ID로 화면만 시드(첫 저장 시 DB 반영) */
export async function loadAssignedWorkers(
  recipientId: string,
  seedWorkerIds: string[] = [],
): Promise<AssignedStore> {
  try {
    const items = await fetchRecipientServiceWorkers(recipientId);
    if (items.length > 0) return itemsToStore(items);
  } catch {
    // fall through to seed
  }
  return seedStore(seedWorkerIds);
}

export async function saveAssignedWorkers(
  recipientId: string,
  workers: Record<string, string[]>,
  familyRelations: Record<string, string>,
): Promise<AssignedStore> {
  const items = storeToItems({ workers, familyRelations });
  const saved = await replaceRecipientServiceWorkers(recipientId, items);
  return itemsToStore(saved);
}
