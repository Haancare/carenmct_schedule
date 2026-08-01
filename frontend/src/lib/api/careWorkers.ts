import apiClient from "@/lib/api/client";
import type { CareWorkerDto } from "@/lib/api/paymentAssignment.types";
import { normalizePositionCode } from "@/features/payment-assignment/constants";
import { SEED_CARE_WORKERS } from "@/lib/mock/paymentAssignmentSeed";

const USE_API = process.env.NEXT_PUBLIC_PAYMENT_ASSIGNMENT_MOCK === "false";

type CareWorkerApiDto = CareWorkerDto & { dob?: string | null };

let cache: CareWorkerDto[] | null = null;
let loadPromise: Promise<CareWorkerDto[]> | null = null;

function normalizeCareWorker(raw: CareWorkerApiDto): CareWorkerDto {
  return {
    id: raw.id,
    name: raw.name,
    nickname: raw.nickname,
    birth: raw.birth ?? raw.dob ?? "",
    positionCode: normalizePositionCode(raw.positionCode) || raw.positionCode,
    status: raw.status,
  };
}

export async function ensureCareWorkersLoaded(): Promise<CareWorkerDto[]> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (USE_API) {
      const { data } = await apiClient.get<CareWorkerApiDto[]>(
        "/api/payment-assignment/care-workers",
      );
      cache = data.map(normalizeCareWorker);
      return cache;
    }
    cache = SEED_CARE_WORKERS;
    return SEED_CARE_WORKERS;
  })();

  return loadPromise;
}

export function getCareWorkerName(id: string): string {
  const worker = (cache ?? SEED_CARE_WORKERS).find((w) => w.id === id);
  if (!worker) return id;
  return worker.name || worker.nickname || id;
}

export function getCareWorkerBirth(id: string): string {
  const worker = (cache ?? SEED_CARE_WORKERS).find((w) => w.id === id);
  return worker?.birth?.trim() || "";
}

/** 표시용: "이름" 또는 "이름  YYYY-MM-DD" (별칭 제외 — Figma 일정·집계·사이드바 기준) */
export function formatCareWorkerLabel(id: string): string {
  const worker = (cache ?? SEED_CARE_WORKERS).find((w) => w.id === id);
  if (!worker) return id;
  const birth = worker.birth?.trim();
  return birth ? `${worker.name}  ${birth}` : worker.name;
}

export function formatCareWorkerFromDto(worker: CareWorkerDto): string {
  const birth = worker.birth?.trim();
  return birth ? `${worker.name}  ${birth}` : worker.name;
}

export function getCareWorkersList(): CareWorkerDto[] {
  return cache ?? SEED_CARE_WORKERS;
}

export function resetCareWorkerCache() {
  cache = null;
  loadPromise = null;
}
