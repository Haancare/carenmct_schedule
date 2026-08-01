export interface CurrentFacilityDto {
  id: string;
  name: string;
  alias: string | null;
  code: string | null;
  category: string;
  subCategories: string[];
  uniqueNum: string | null;
}

export function getFacilityDisplayName(facility: CurrentFacilityDto): string {
  return facility.alias?.trim() || facility.name;
}

export function buildFacilityTooltip(facility: CurrentFacilityDto): string {
  const sub = facility.subCategories.length
    ? facility.subCategories.join("·")
    : "-";
  const code = facility.code ?? "-";
  const uniqueNum = facility.uniqueNum ?? "-";
  return `${facility.name} (${code})\n${facility.category} · ${sub}\n사업자번호: ${uniqueNum}\n※ 기관정보는 「한케어 업무포털」에서 관리합니다`;
}
