import { useState, useEffect } from 'react';
import { registerFeeRates } from './mockData';

// ── 수가 항목 타입 ─────────────────────────────────────────────────────
interface FeeItem {
  code: string;    // 분류번호 (예: '가-1')
  label: string;   // 분류 텍스트 (표시용)
  amount: number;  // 금액(원) — 등급 무관한 경우
  applyFamily?: boolean;
  gradeAmounts?: Record<string, number>; // grade key('1'~'5','인지지원') → 금액 (주간보호)
  // ── 제공시간 구조 필드 — 수가 자동 계산용 ────────────────────────────
  minMinutes: number;           // 이상 (inclusive)
  maxMinutes: number | null;    // null = 상한 없음(이상 모두), 숫자 = 상한값
  maxInclusive?: boolean;       // true = 이하(≤), false/undefined = 미만(<)
}

interface PartialRule {
  minMinutes: number; // 이상
  maxMinutes: number; // 미만
  rate: number;       // 적용률 (예: 0.8 = 80%)
}

interface ServiceFeeTable {
  serviceType: string;   // 급여유형 키
  serviceLabel: string;  // 급여유형 명칭
  note?: string;         // 유형별 특이사항
  partialRule?: PartialRule; // 시간 조건별 부분 적용 규칙
  items: FeeItem[];
}

type YearFeeData = Record<string, ServiceFeeTable>; // serviceType → table

// ── 2026년 기본 수가 데이터 ───────────────────────────────────────────
const DEFAULT_VISIT_CARE: ServiceFeeTable = {
  serviceType: 'visit_care',
  serviceLabel: '방문요양',
  note: '가족요양은 가-1 ~ 가-3 항목만 적용',
  items: [
    { code: '가-1',  label: '30분 이상',  amount:  17450, applyFamily: true,  minMinutes:  30, maxMinutes:  60 },
    { code: '가-2',  label: '60분 이상',  amount:  25320, applyFamily: true,  minMinutes:  60, maxMinutes:  90 },
    { code: '가-3',  label: '90분 이상',  amount:  34120, applyFamily: true,  minMinutes:  90, maxMinutes: 120 },
    { code: '가-4',  label: '120분 이상', amount:  43430, applyFamily: false, minMinutes: 120, maxMinutes: 150 },
    { code: '가-5',  label: '150분 이상', amount:  50640, applyFamily: false, minMinutes: 150, maxMinutes: 180 },
    { code: '가-6',  label: '180분 이상', amount:  57020, applyFamily: false, minMinutes: 180, maxMinutes: 210 },
    { code: '가-7',  label: '210분 이상', amount:  63530, applyFamily: false, minMinutes: 210, maxMinutes: 240 },
    { code: '가-8',  label: '240분 이상', amount:  70080, applyFamily: false, minMinutes: 240, maxMinutes: 270 },
    { code: '가-9',  label: '270분 이상', amount:  70080, applyFamily: false, minMinutes: 270, maxMinutes: 300 },
    { code: '가-10', label: '300분 이상', amount:  87530, applyFamily: false, minMinutes: 300, maxMinutes: 330 },
    { code: '가-11', label: '330분 이상', amount:  95400, applyFamily: false, minMinutes: 330, maxMinutes: 360 },
    { code: '가-12', label: '360분 이상', amount: 104200, applyFamily: false, minMinutes: 360, maxMinutes: 390 },
    { code: '가-13', label: '390분 이상', amount: 113510, applyFamily: false, minMinutes: 390, maxMinutes: 420 },
    { code: '가-14', label: '420분 이상', amount: 120720, applyFamily: false, minMinutes: 420, maxMinutes: 450 },
    { code: '가-15', label: '450분 이상', amount: 127100, applyFamily: false, minMinutes: 450, maxMinutes: 480 },
    { code: '가-16', label: '480분 이상', amount: 140160, applyFamily: false, minMinutes: 480, maxMinutes: null },
  ],
};

const DEFAULT_VISIT_BATH: ServiceFeeTable = {
  serviceType: 'visit_bath',
  serviceLabel: '방문목욕',
  note: '나-1: 차량이용(차량내) / 나-2: 차량이용(가정내) / 나-3: 차량미이용',
  partialRule: { minMinutes: 40, maxMinutes: 60, rate: 0.8 },
  items: [
    { code: '나-1', label: '방문목욕 차량을 이용한 경우 (차량 내 목욕)',  amount: 88990, minMinutes: 60, maxMinutes: null },
    { code: '나-2', label: '방문목욕 차량을 이용한 경우 (가정 내 목욕)',  amount: 80230, minMinutes: 60, maxMinutes: null },
    { code: '나-3', label: '방문목욕 차량을 이용하지 아니한 경우',        amount: 50100, minMinutes: 60, maxMinutes: null },
  ],
};
const DEFAULT_VISIT_NURSING: ServiceFeeTable = {
  serviceType: 'visit_nursing',
  serviceLabel: '방문간호',
  note: '급여제공시간에 따라 수가 구분 적용',
  items: [
    { code: '다-1', label: '15분 이상 ~ 30분 미만', amount: 42880, minMinutes: 15, maxMinutes:  30 },
    { code: '다-2', label: '30분 이상 ~ 60분 미만', amount: 53770, minMinutes: 30, maxMinutes:  60 },
    { code: '다-3', label: '60분 이상',              amount: 64690, minMinutes: 60, maxMinutes: null },
  ],
};
const DEFAULT_DAY_CARE: ServiceFeeTable = {
  serviceType: 'day_care',
  serviceLabel: '주간보호',
  note: '등급 및 급여제공시간에 따라 수가 구분 적용',
  items: [
    { code: '라-1', label: '3시간 이상 ~ 6시간 미만',   amount: 0, minMinutes: 180, maxMinutes: 360,  gradeAmounts: { '1': 41820, '2': 38720, '3': 35740, '4': 34120, '5': 32490, '인지지원': 32490 } },
    { code: '라-2', label: '6시간 이상 ~ 8시간 미만',   amount: 0, minMinutes: 360, maxMinutes: 480,  gradeAmounts: { '1': 56060, '2': 51930, '3': 47940, '4': 46300, '5': 44650, '인지지원': 44650 } },
    { code: '라-3', label: '8시간 이상 ~ 10시간 미만',  amount: 0, minMinutes: 480, maxMinutes: 600,  gradeAmounts: { '1': 69730, '2': 64590, '3': 59640, '4': 58010, '5': 56360, '인지지원': 56360 } },
    { code: '라-4', label: '10시간 이상 ~ 13시간 이하', amount: 0, minMinutes: 600, maxMinutes: 780, maxInclusive: true, gradeAmounts: { '1': 76820, '2': 71160, '3': 65750, '4': 64090, '5': 62460, '인지지원': 56360 } },
    { code: '라-5', label: '13시간 초과',                amount: 0, minMinutes: 781, maxMinutes: null, gradeAmounts: { '1': 82370, '2': 76310, '3': 70500, '4': 68860, '5': 67240, '인지지원': 56360 } },
  ],
};

const DEFAULT_FULL_DAY_VISIT: ServiceFeeTable = {
  serviceType: 'full_day_visit',
  serviceLabel: '종일방문',
  note: '1건당 정액 수가 적용',
  items: [
    { code: '마-1', label: '종일방문 (1건당)', amount: 98860, minMinutes: 0, maxMinutes: null },
  ],
};

const SVC_ORDER: ServiceFeeTable[] = [
  DEFAULT_VISIT_CARE, DEFAULT_FULL_DAY_VISIT, DEFAULT_VISIT_BATH, DEFAULT_VISIT_NURSING, DEFAULT_DAY_CARE,
];

type AnnualFeeStore = Record<number, Record<string, ServiceFeeTable>>;

const feeStore: AnnualFeeStore = {
  2026: Object.fromEntries(SVC_ORDER.map(t => [t.serviceType, { ...t, items: t.items.map(i => ({ ...i })) }])),
};

// 앱 로드 시 즉시 mockData 수가 스토어에 등록 — 관리자 페이지 방문 여부와 무관하게 수가 계산 가능
Object.entries(feeStore).forEach(([y, tables]) => registerFeeRates(Number(y), tables as any));

const fmt   = (n: number) => n.toLocaleString('ko-KR');
const parse = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10) || 0;

export function AnnualFeeRate() {
  const [years, setYears] = useState<AnnualFeeStore>(() =>
    JSON.parse(JSON.stringify(feeStore)) as AnnualFeeStore
  );
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedSvc, setSelectedSvc] = useState('visit_care');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ServiceFeeTable | null>(null);

  const yearList = Object.keys(years).map(Number).sort((a, b) => b - a);
  const yearData = years[selectedYear] ?? {};
  const cur: ServiceFeeTable = yearData[selectedSvc] ?? SVC_ORDER.find(s => s.serviceType === selectedSvc)!;

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(cur))); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    if (!draft) return;
    const next = { ...(years[selectedYear] ?? {}), [selectedSvc]: draft };
    setYears(prev => ({ ...prev, [selectedYear]: next }));
    registerFeeRates(selectedYear, next as any); // mockData 수가 스토어 업데이트
    setEditing(false); setDraft(null);
  };

  const addYear = () => {
    const maxY = Math.max(...yearList);
    const newY = maxY + 1;
    const base = years[maxY] ?? Object.fromEntries(SVC_ORDER.map(t => [t.serviceType, t]));
    setYears(prev => ({ ...prev, [newY]: JSON.parse(JSON.stringify(base)) }));
    setSelectedYear(newY); setEditing(false); setDraft(null);
  };

  const data = editing && draft ? draft : cur;

  const setDraftItem = (idx: number, field: keyof FeeItem, val: string | number | boolean) =>
    setDraft(d => {
      if (!d) return d;
      const items = d.items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
      return { ...d, items };
    });

  const addItem = () => setDraft(d => {
    if (!d) return d;
    const n = d.items.length + 1;
    return { ...d, items: [...d.items, { code: `가-${n}`, label: '', amount: 0, applyFamily: false }] };
  });

  const removeItem = (idx: number) => setDraft(d => {
    if (!d) return d;
    return { ...d, items: d.items.filter((_, i) => i !== idx) };
  });

  const TH: React.CSSProperties = {
    padding: '8px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700,
    background: '#1e0a3c', color: '#e9d5ff', border: '1px solid #4c1d95', whiteSpace: 'nowrap',
  };
  const TD = (center = true): React.CSSProperties => ({
    padding: '8px 14px', textAlign: center ? 'center' : 'left', fontSize: 13,
    border: '1px solid #e9d5ff', color: '#1e293b',
  });
  const inputSt: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '3px 6px', border: '1px solid #a78bfa',
    borderRadius: 4, outline: 'none', background: '#faf7ff', boxSizing: 'border-box',
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '24px 32px', background: '#f8f5ff', fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e0a3c', margin: 0 }}>연도별 수가</h2>
      </div>

      {/* 연도 탭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {yearList.map(y => (
          <button key={y} onClick={() => { setSelectedYear(y); setEditing(false); setDraft(null); }}
            style={{ padding: '5px 18px', fontSize: 13, borderRadius: 6, cursor: 'pointer', fontWeight: y === selectedYear ? 700 : 400,
              border: y === selectedYear ? '2px solid #7c3aed' : '1px solid #c4b5fd',
              background: y === selectedYear ? '#7c3aed' : '#fff', color: y === selectedYear ? '#fff' : '#7c3aed' }}>
            {y}년
          </button>
        ))}
        <button onClick={addYear}
          style={{ padding: '5px 14px', fontSize: 12, borderRadius: 6, cursor: 'pointer', border: '1px dashed #a78bfa', background: '#faf7ff', color: '#7c3aed' }}>
          + 연도 추가
        </button>
      </div>

      {/* 급여유형 탭 */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '2px solid #e9d5ff' }}>
        {SVC_ORDER.map(s => {
          const on = selectedSvc === s.serviceType;
          const hasData = (yearData[s.serviceType]?.items?.length ?? 0) > 0 || s.items.length > 0;
          return (
            <button key={s.serviceType} onClick={() => { setSelectedSvc(s.serviceType); setEditing(false); setDraft(null); }}
              style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', border: 'none',
                borderBottom: on ? '3px solid #7c3aed' : '3px solid transparent',
                color: on ? '#7c3aed' : '#94a3b8', fontWeight: on ? 700 : 500, marginBottom: -2,
                display: 'flex', alignItems: 'center', gap: 5 }}>
              {s.serviceLabel}
              {!hasData && <span style={{ fontSize: 10, color: '#e2e8f0' }}>●</span>}
            </button>
          );
        })}
      </div>

      {/* 수가 테이블 */}
      {data.note && (
        <div style={{ fontSize: 12, color: '#7c3aed', background: '#ede9fe', border: '1px solid #c4b5fd', borderRadius: 6, padding: '6px 12px', marginBottom: 8 }}>
          ※ {data.note}
        </div>
      )}
      {data.partialRule && (
        <div style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 12px', marginBottom: 12 }}>
          ※ 서비스 제공시간이 <strong>{data.partialRule.minMinutes}분 이상 {data.partialRule.maxMinutes}분 미만</strong>인 경우 <strong>{data.partialRule.rate * 100}%</strong>만 적용
          {!editing && data.items.length > 0 && (
            <span style={{ color: '#94a3b8', marginLeft: 8 }}>
              (예: 나-1 기준 {fmt(Math.ceil((data.items[0]?.amount ?? 0) * data.partialRule.rate / 10) * 10)}원)
            </span>
          )}
        </div>
      )}

      {data.items.length === 0 && !editing ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 13, background: '#fff', borderRadius: 8, border: '1px solid #e9d5ff' }}>
          수가 데이터가 없습니다. [수정]을 눌러 입력하세요.
        </div>
      ) : data.items.some(i => i.gradeAmounts) && !editing ? (
        /* ── 등급별 수가 2차원 테이블 (주간보호) ── */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 80 }}>분류번호</th>
                <th style={{ ...TH, minWidth: 180, textAlign: 'left' }}>구분 (제공시간)</th>
                {['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => (
                  <th key={g} style={{ ...TH, minWidth: 90 }}>{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => {
                const ga = item.gradeAmounts ?? {};
                const keyMap: Record<string, string> = { '1등급':'1','2등급':'2','3등급':'3','4등급':'4','5등급':'5','인지지원등급':'인지지원' };
                return (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#faf7ff' }}>
                    <td style={{ ...TD() }}>{item.code}</td>
                    <td style={{ ...TD(false) }}>{item.label}</td>
                    {['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => (
                      <td key={g} style={{ ...TD(), fontWeight: 600 }}>{fmt(ga[keyMap[g]] ?? 0)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 90 }}>분류번호</th>
                <th style={{ ...TH, minWidth: 150, textAlign: 'left' }}>분류</th>
                {editing && <th style={{ ...TH, width: 80 }}>이상(분)</th>}
                {editing && <th style={{ ...TH, width: 80 }}>미만(분)</th>}
                {/* 등급별 금액 헤더 (주간보호) or 단일 금액 헤더 */}
                {data.items.some(i => i.gradeAmounts) ? (
                  ['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => (
                    <th key={g} style={{ ...TH, minWidth: 90 }}>{g}</th>
                  ))
                ) : (
                  <th style={{ ...TH, minWidth: 130 }}>금액(원)</th>
                )}
                {data.partialRule && !editing && (
                  <th style={{ ...TH, minWidth: 130, color: '#fde68a' }}>
                    {data.partialRule.minMinutes}~{data.partialRule.maxMinutes}분 미만<br/>
                    ({data.partialRule.rate * 100}% 적용)
                  </th>
                )}
                {selectedSvc === 'visit_care' && <th style={{ ...TH, minWidth: 110 }}>가족요양 적용</th>}
                {editing && <th style={{ ...TH, width: 60 }}>삭제</th>}
              </tr>
            </thead>
            <tbody>
              {(editing ? draft!.items : data.items).map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#faf7ff' }}>
                  <td style={{ ...TD() }}>
                    {editing ? (
                      <input value={item.code} onChange={e => setDraftItem(idx, 'code', e.target.value)} style={{ ...inputSt, textAlign: 'center', width: 70 }} />
                    ) : item.code}
                  </td>
                  <td style={{ ...TD(false) }}>
                    {editing ? (
                      <input value={item.label} onChange={e => setDraftItem(idx, 'label', e.target.value)} style={inputSt} />
                    ) : item.label}
                  </td>
                  {editing && (
                    <td style={{ ...TD() }}>
                      <input type="number" value={item.minMinutes ?? ''} min={0}
                        onChange={e => setDraftItem(idx, 'minMinutes', parseInt(e.target.value) || 0)}
                        style={{ ...inputSt, width: 60, textAlign: 'right' }} />
                    </td>
                  )}
                  {editing && (
                    <td style={{ ...TD() }}>
                      <input type="number" value={item.maxMinutes ?? ''} min={0} placeholder="없음"
                        onChange={e => setDraftItem(idx, 'maxMinutes', e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                        style={{ ...inputSt, width: 60, textAlign: 'right' }} />
                    </td>
                  )}
                  {item.gradeAmounts ? (
                    /* 등급별 금액 셀 — 주간보호 */
                    (['1','2','3','4','5','인지지원'] as const).map(k => {
                      const glabel = k === '인지지원' ? '인지지원등급' : `${k}등급`;
                      const val = (item.gradeAmounts ?? {})[k] ?? 0;
                      return (
                        <td key={k} style={{ ...TD(), minWidth: 90 }}>
                          {editing ? (
                            <input value={fmt(val)}
                              onChange={e => setDraft(d => {
                                if (!d) return d;
                                const items = d.items.map((it, i) => i === idx
                                  ? { ...it, gradeAmounts: { ...(it.gradeAmounts ?? {}), [k]: parse(e.target.value) } }
                                  : it);
                                return { ...d, items };
                              })}
                              title={glabel}
                              style={{ ...inputSt, textAlign: 'right', width: 80 }} />
                          ) : <strong>{fmt(val)}</strong>}
                        </td>
                      );
                    })
                  ) : (
                    <td style={{ ...TD() }}>
                      {editing ? (
                        <input value={fmt(item.amount)} onChange={e => setDraftItem(idx, 'amount', parse(e.target.value))}
                          style={{ ...inputSt, textAlign: 'right', width: 110 }} />
                      ) : <strong>{fmt(item.amount)}</strong>}
                    </td>
                  )}
                  {data.partialRule && !editing && (
                    <td style={{ ...TD(), background: idx % 2 === 0 ? '#fffbeb' : '#fef9e7' }}>
                      <strong style={{ color: '#b45309' }}>{fmt(Math.ceil(item.amount * data.partialRule!.rate / 10) * 10)}</strong>
                    </td>
                  )}
                  {selectedSvc === 'visit_care' && (
                    <td style={{ ...TD() }}>
                      {editing ? (
                        <input type="checkbox" checked={item.applyFamily ?? false}
                          onChange={e => setDraftItem(idx, 'applyFamily', e.target.checked)}
                          style={{ accentColor: '#7c3aed', width: 14, height: 14 }} />
                      ) : (
                        item.applyFamily
                          ? <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', fontWeight: 600 }}>적용</span>
                          : <span style={{ fontSize: 11, color: '#cbd5e1' }}>-</span>
                      )}
                    </td>
                  )}
                  {editing && (
                    <td style={{ ...TD() }}>
                      <button onClick={() => removeItem(idx)}
                        style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, cursor: 'pointer', border: '1px solid #fecaca', background: '#fff1f2', color: '#dc2626' }}>삭제</button>
                    </td>
                  )}
                </tr>
              ))}
              {editing && (
                <tr>
                  <td colSpan={selectedSvc === 'visit_care' ? 5 : 4} style={{ padding: '6px 8px', borderTop: '1px solid #e9d5ff' }}>
                    <button onClick={addItem}
                      style={{ fontSize: 12, padding: '4px 14px', borderRadius: 5, cursor: 'pointer', border: '1px dashed #a78bfa', background: '#faf7ff', color: '#7c3aed' }}>
                      + 항목 추가
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 비고 */}
      {editing && draft && (
        <div style={{ marginTop: 12, maxWidth: 600 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>비고</div>
          <textarea value={draft.note ?? ''} onChange={e => setDraft(d => d ? { ...d, note: e.target.value } : d)}
            rows={2} placeholder="유형별 특이사항"
            style={{ width: '100%', fontSize: 12, padding: '6px 10px', border: '1px solid #a78bfa', borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box', background: '#faf7ff' }} />
        </div>
      )}

      {/* 버튼 */}
      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        {editing ? (
          <>
            <button onClick={cancelEdit}
              style={{ padding: '7px 20px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b' }}>취소</button>
            <button onClick={saveEdit}
              style={{ padding: '7px 24px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', fontWeight: 700 }}>저장</button>
          </>
        ) : (
          <button onClick={startEdit}
            style={{ padding: '7px 24px', fontSize: 13, borderRadius: 6, cursor: 'pointer', border: '1px solid #7c3aed', background: '#faf7ff', color: '#7c3aed', fontWeight: 700 }}>수정</button>
        )}
      </div>
    </div>
  );
}
