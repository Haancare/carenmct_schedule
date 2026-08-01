import apiClient from "@/lib/api/client";

export type PlanScheduleImportResponse = {
  batchId: number;
  status: string;
  totalRows: number;
  successRows: number;
  skippedRows: number;
  errorRows: number;
  errors: string[];
};

export type ClaimScheduleImportResponse = PlanScheduleImportResponse;

const multipartConfig = {
  headers: { "Content-Type": undefined },
  timeout: 120_000,
  transformRequest: [
    (body: unknown, headers: Record<string, unknown>) => {
      if (headers && typeof headers === "object") {
        delete headers["Content-Type"];
      }
      return body;
    },
  ],
};

async function waitForImportBatch(
  batchId: number,
): Promise<PlanScheduleImportResponse> {
  const started = Date.now();
  const maxMs = 10 * 60_000;
  while (Date.now() - started < maxMs) {
    const { data } = await apiClient.get<PlanScheduleImportResponse>(
      `/api/imports/batches/${batchId}`,
    );
    if (data.status !== "running" && data.status !== "pending") {
      return data;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("가져오기 처리 시간이 초과되었습니다.");
}

export async function uploadPlanScheduleExcel(
  file: File,
): Promise<PlanScheduleImportResponse> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await apiClient.post<PlanScheduleImportResponse>(
    "/api/imports/plan-schedule",
    form,
    multipartConfig,
  );
  if (data.status === "running" || data.status === "pending") {
    return waitForImportBatch(data.batchId);
  }
  return data;
}

export async function uploadClaimScheduleExcel(
  listFile: File,
  detailFile: File,
): Promise<ClaimScheduleImportResponse> {
  const form = new FormData();
  form.append("listFile", listFile);
  form.append("detailFile", detailFile);

  const { data } = await apiClient.post<ClaimScheduleImportResponse>(
    "/api/imports/claim-schedule",
    form,
    multipartConfig,
  );
  if (data.status === "running" || data.status === "pending") {
    return waitForImportBatch(data.batchId);
  }
  return data;
}
