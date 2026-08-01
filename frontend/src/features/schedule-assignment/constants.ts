export type PlanClaimView = "plan" | "claim";

export const CUR_YEAR = 2026;
export const CUR_MONTH = 3;

export const SERVICE_LABELS: Record<string, string> = {
  visit_care: "방문요양",
  family_care: "가족요양",
  full_day_visit: "종일방문",
  visit_bath: "방문목욕",
  visit_nursing: "방문간호",
  day_care: "주간보호",
};

export const SVC_STYLE: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  visit_care: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
  visit_bath: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  visit_nursing: { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
  day_care: { bg: "#f3e8ff", color: "#6d28d9", border: "#c4b5fd" },
  family_care: { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
  full_day_visit: { bg: "#e0e7ff", color: "#4338ca", border: "#a5b4fc" },
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  visit_care: "방문요양",
  visit_bath: "방문목욕",
  visit_nursing: "방문간호",
  day_care: "주간보호",
  family_care: "가족요양",
  full_day_visit: "종일방문",
};

export const TABLE_TH = {
  background: "#152e50",
  color: "rgba(255,255,255,0.88)",
  fontSize: 11,
  fontWeight: 600,
  height: 30,
  padding: "0 8px",
  whiteSpace: "nowrap" as const,
  textAlign: "center" as const,
};

export const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const FAMILY_RELATIONS = [
  "처",
  "남편",
  "자",
  "자부",
  "사위",
  "형제자매",
  "손",
  "배우자의형제자매",
  "외손",
  "부모",
  "기타",
  "친족",
] as const;

export const COPAY_BUTTON_OPTIONS = [
  {
    type: "일반",
    rate: 15,
    short: "일반",
    sub: "15%",
    activeBg: "#f1f5f9",
    activeColor: "#475569",
    activeBorder: "#cbd5e1",
  },
  {
    type: "감경9%",
    rate: 9,
    short: "9%",
    sub: "감경",
    activeBg: "#fff7ed",
    activeColor: "#c2410c",
    activeBorder: "#fdba74",
  },
  {
    type: "감경6%",
    rate: 6,
    short: "6%",
    sub: "감경",
    activeBg: "#f0fdf4",
    activeColor: "#059669",
    activeBorder: "#6ee7b7",
  },
  {
    type: "기초",
    rate: 0,
    short: "기초",
    sub: "0%",
    activeBg: "#fefce8",
    activeColor: "#854d0e",
    activeBorder: "#fde047",
  },
] as const;

export const QUICK_DURATION_PRESETS: Record<
  string,
  { label: string; mins: number }[]
> = {
  visit_care: [
    { label: "3시간", mins: 180 },
    { label: "3시간30분", mins: 210 },
    { label: "4시간", mins: 240 },
    { label: "8시간", mins: 480 },
  ],
  family_care: [
    { label: "60분", mins: 60 },
    { label: "90분", mins: 90 },
  ],
  full_day_visit: [{ label: "12시간", mins: 720 }],
  visit_bath: [
    { label: "40분", mins: 40 },
    { label: "60분", mins: 60 },
  ],
  visit_nursing: [
    { label: "15분", mins: 15 },
    { label: "30분", mins: 30 },
    { label: "60분", mins: 60 },
  ],
  day_care: [
    { label: "3시간", mins: 180 },
    { label: "6시간", mins: 360 },
    { label: "8시간", mins: 480 },
    { label: "10시간", mins: 600 },
  ],
};

export const BATH_TYPE_OPTIONS = [
  "차량이용(차량내)",
  "차량이용(가정내)",
  "차량미이용",
] as const;
