import apiClient from "@/lib/api/client";
import type { CurrentFacilityDto } from "@/lib/api/session.types";

export async function fetchCurrentFacility(): Promise<CurrentFacilityDto> {
  const { data } = await apiClient.get<CurrentFacilityDto>(
    "/api/session/current-facility",
  );
  return data;
}
