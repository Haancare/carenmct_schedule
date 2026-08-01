import React from 'react';

function AutoTA({ value, onChange, style, minRows = 2 }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
  minRows?: number;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
  return (
    <textarea ref={ref} value={value} rows={minRows}
      onChange={e => { onChange(e); const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
      style={{ ...style, overflow:'hidden', resize:'none' }}/>
  );
}

interface CarePlanDocumentProps {
  formDraft: Record<string, any>;
  setF: (k: string, v: any) => void;
}

interface SvcRow {
  svcType: string;
  area: string;
  subGoal: string;
  need: string;
  detail: string;
  freq: string;
  time: string;
  writer: string;
}

const DEFAULT_GOALS = `청결상태유지를 통한 자존감
규칙적 배뇨활동유도
정확한 복약으로 증상완화
지원을 통한 일상생활수행
사회생활 수행능력 향상하기`;

const DEFAULT_OPINION = `*수급자 정기욕구 및 모니터링으로 급여계획서를 작성함

1. 주요기능상태
-수급자는 독거로 아파트에 거주하고 있으며 가정에서 천천히 이동하시고 외출시 지팡이 및 보행기 사용하여 이동하심.
-퇴행성 관절염이 심하여 바닥에 앉지 못하시고 주로 소파에 앉아 생활하심.
-우측어깨통증으로 팔을 올리기가 힘들어 하신다고 하시고 엉치부위가 아파서 파스를 붙이신다고 하심
-혈관이 좁아져 혈액개선제, 아스피린, 고혈압 약을 복용하고 계신다고 하심...

2. 서비스제공방향(욕구평가에 의함)
- 현재 기능상태 유지 및 향상을 위한 관절스트레칭 및 소근육 운동 매일 꾸준히 하시도록 하여 하지근력 강화와 관절구축이 예방될수 있도록 함
-일상생활 전반에 도움을 필요로 하여 취사, 청소 등 지원을 통해 일상생활을 수행할 수 있도록 도와주고자 함.

3. 개인별장기요양이용계획서와 다른점
-개인별장기요양이용계획서 욕구파악을 통한 정서지원 항목은 없지만 독거로 거주하고 있어 욕구를 파악하고 필요로 하는 서비스를 제공하기 위해 정서지원 항목을 추가로 작성함.
-개인별장기요양이용계획서에는 인지지원 항목이 작성되어 있지만, 인지활동보다는 신체활동과 일상생활지원에 도움받기를 희망하여 인지지원과 관련된 항목은 제외하고 작성함.
-개인별장기요양이용계획서에는 세탁만 작성되어 있지만 보호자가 취사와 청소를 원하셔서 관련항목을 작성함.
-개인별장기이용계획서에는 방문요양 주4회 180분이상(방문당) 방문목욕 월1회, 방문간호 월1회, 주야간보호 주1회 로 서비스를 이용하게 되어있으나 방문요양 주5회 180분 이상하고 남은 수가로 주2회 가족요양 60분이상 서비스를 제공하여 수급자의 삶의 질 향상에 도움을 주고자 함.
-개인별장기이용계획서에는 관절지원이 없으나 관절구축예방을 위한 운동이필요하여 관절운동지원을 추가하여 작성함.

4. 특이사항
- 상기급여계획은 수급자 및 보호자의 요청또는 예측불가한 일일케어 내용 변수에 의해 변경될수 있으며 수급자 보호자의 상황에 따라 토.일 공휴일 야간, 초과 근무할수 있으며 남은수가 급여제공요청시 급여를 제공하여 수급자의 삶의 질 향상에 도움을 주고자함

5. 모니터링
-신체활동이 호전되어 화장실 사용이 가능하여 배뇨문제관리 10분을 관절운동 지원 10분 늘려 서비스 제공할 계획임.
-그 외에 급여제공계획에는 수급자 및 보호자께서 만족하고 있어 계속 급여를 제공하기로 안내함.

방문요양 주5회, 방문당 180분이상 급여비용 1,140,400원 본인부담금 68,420원
       주2회, 방문당 60분이상 급여비용 202,560원 본인부담금 12,150원`;

const DEFAULT_ROWS: SvcRow[] = [
  // 신체활동지원 - 세부목표 1
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'옷갈아입기 지시 및 지켜보기 도움', detail:'스스로 옷 입을 수 있도록 지시 및 적절하게 입도록 지켜보기', freq:'일 1회', time:'10', writer:'김권민' },
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'세면도움', detail:'세면 과정에서 도움이 필요한 부분 도와주기(비누칠, 편마비 시 일부 얼굴 닦기 도움 등)', freq:'일 1회', time:'10', writer:'김권민' },
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'양치질 도움', detail:'양치질 과정에서 도움이 필요한 부분 도와주기(치약 바르기, 칫솔질, 입 헹구기 등)', freq:'일 1회', time:'5', writer:'김권민' },
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'몸씻기 도움', detail:'몸 씻기 과정에서 도움이 필요한 부분 도와주기(물뿌리기, 비누칠, 헹구기 등)', freq:'주 1회', time:'30', writer:'김권민' },
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'머리감기 도움', detail:'머리감기 과정에서 도움이 필요한 부분 도와주기(비누칠 하기, 머리 헹구기, 물기 닦기 등)', freq:'주 1회', time:'30', writer:'김권민' },
  { svcType:'방문요양', area:'신체활동지원', subGoal:'옷갈아입기, 세면도움등 신체청결을 위하여 매일 깨끗한 옷으로 갈아입기', need:'손발톱깎기', detail:'손발톱 깎기 도움', freq:'필요시', time:'10', writer:'김권민' },
  // 신체활동지원 - 세부목표 2
  { svcType:'방문요양', area:'신체활동지원', subGoal:'정확한 시간에 맞추어 복약관리로 합병증 예방', need:'정확한 복약도움(시간, 용량, 용법 등)', detail:'약 복용 원칙 지켜 약 챙겨먹기 도움', freq:'일 1회', time:'10', writer:'김권민' },
  // 신체활동지원 - 세부목표 3
  { svcType:'방문요양', area:'신체활동지원', subGoal:'근력 약화로 인한 일상 생활 수행에 어려움을 극복하기 위한 관절 구축 예방 운동을 매일 실시', need:'관절운동지원', detail:'기능상태에 맞는 적절한 관절 운동 지원', freq:'일 1회', time:'30', writer:'김권민' },
  // 정서지원
  { svcType:'방문요양', area:'정서지원', subGoal:'말벗 및 격려 위로등을 통하여 우울감 감소 및 정서적 지원 도움', need:'말벗 및 위로 등 정서적 지원', detail:'말벗, 편지쓰기, 안부확인을 위한 방문 등', freq:'일 1회', time:'30', writer:'김권민' },
  // 일상생활지원,환경관리
  { svcType:'방문요양', area:'일상생활지원,환경관리', subGoal:'수급자의 건강을 위한 식단으로 조리하여 제공하고 주1~2회 청결하게 세탁, 청소등 지원', need:'취사', detail:'식재료 준비, 밥짓기, 반찬 준비, 설거지, 헹주 삶기, 음식물 분리수거 등', freq:'일 1회', time:'60', writer:'김권민' },
  { svcType:'방문요양', area:'일상생활지원,환경관리', subGoal:'수급자의 건강을 위한 식단으로 조리하여 제공하고 주1~2회 청결하게 세탁, 청소등 지원', need:'세탁', detail:'수급자의 옷, 양말, 수건, 침구류, 걸레등 세탁', freq:'주 2회', time:'30', writer:'김권민' },
  { svcType:'방문요양', area:'일상생활지원,환경관리', subGoal:'수급자의 건강을 위한 식단으로 조리하여 제공하고 주1~2회 청결하게 세탁, 청소등 지원', need:'청소 및 주변 정돈', detail:'수급자가 거주하는 방, 거실, 화장실청소, 이부자리정리정돈등', freq:'일 1회', time:'30', writer:'김권민' },
  // 개인활동지원
  { svcType:'방문요양', area:'개인활동지원', subGoal:'병원진료 및 필요시 부축 또는 동행하여 외출후 책임귀가', need:'병원동행', detail:'병원진료를 위한 외출 시 동행 및 책임귀가', freq:'필요시', time:'30', writer:'김권민' },
  { svcType:'방문요양', area:'개인활동지원', subGoal:'병원진료 및 필요시 부축 또는 동행하여 외출후 책임귀가', need:'산책 동행(도움)', detail:'산책을 위한 동행 및 책임귀가', freq:'필요시', time:'30', writer:'김권민' },
];

const cb = '1px solid #d1d5db';
const nlS: React.CSSProperties = { fontSize:11, color:'#1e293b', padding:'6px 8px', borderRight:cb, borderBottom:cb, background:'#f3f4f6', fontWeight:600, verticalAlign:'middle', whiteSpace:'nowrap' };
const nvS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'6px 10px', borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
const niS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 };
const ntS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', resize:'vertical' as const, padding:'4px 6px', lineHeight:1.6, borderRadius:3 };
const ntbl: React.CSSProperties = { width:'100%', borderCollapse:'collapse' as const, tableLayout:'fixed' as const };
const thS: React.CSSProperties = { fontSize:12, fontWeight:700, color:'#1e293b', padding:'6px 6px', borderRight:cb, borderBottom:cb, background:'#f3f4f6', verticalAlign:'middle', textAlign:'center' as const };
const tdS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'4px 6px', borderRight:cb, borderBottom:cb, verticalAlign:'top' };

export function CarePlanDocument({ formDraft, setF }: CarePlanDocumentProps) {
  const f = (key: string, def: any = '') => formDraft[key] ?? def;

  // 자동하이픈 날짜 입력 (YYYY-MM-DD, 캘린더 없음)
  const dateField = (key: string, def: string) => (
    <input value={String(f(key, def))} placeholder="YYYY-MM-DD" maxLength={10}
      onChange={e => {
        const d = e.target.value.replace(/\D/g,'').slice(0,8);
        setF(key, d.length>6 ? d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6) : d.length>4 ? d.slice(0,4)+'-'+d.slice(4) : d);
      }}
      style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3, width:'100%' }}/>
  );

  // rows helpers
  const rows: SvcRow[] = (() => {
    const v = formDraft['cpd_rows'];
    if (Array.isArray(v)) return v as SvcRow[];
    if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {} }
    return DEFAULT_ROWS;
  })();

  const setRows = (next: SvcRow[]) => setF('cpd_rows', next);
  const updRow = (idx: number, patch: Partial<SvcRow>) => {
    const next = rows.map((r, i) => i === idx ? { ...r, ...patch } : r);
    setRows(next);
  };
  const delRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  // 필요영역 추가 — 테이블 맨 아래에 새 그룹 추가
  const addArea = () => {
    setRows([...rows, { svcType:'방문요양', area:'', subGoal:'', need:'', detail:'', freq:'', time:'', writer:'' }]);
  };
  // 세부목표 추가 — 해당 필요영역 그룹의 마지막 행 뒤에 삽입
  const addSubGoal = (startIdx: number, span: number) => {
    const area = rows[startIdx].area;
    const next = [...rows];
    next.splice(startIdx + span, 0, { svcType:'방문요양', area, subGoal:'', need:'', detail:'', freq:'', time:'', writer:'' });
    setRows(next);
  };
  // 필요내용 추가 — 해당 세부목표 그룹의 마지막 행 뒤에 삽입
  const addNeed = (startIdx: number, span: number) => {
    const { area, subGoal } = rows[startIdx];
    const next = [...rows];
    next.splice(startIdx + span, 0, { svcType:'방문요양', area, subGoal, need:'', detail:'', freq:'', time:'', writer:'' });
    setRows(next);
  };

  // set a field across a range of rows (for merged-cell editing)
  const setRangeField = (startIdx: number, count: number, field: keyof SvcRow, val: string) => {
    const next = rows.map((r, i) => (i >= startIdx && i < startIdx + count) ? { ...r, [field]: val } : r);
    setRows(next);
  };

  // compute rowspans
  const areaSpan: number[] = new Array(rows.length).fill(0);
  const subGoalSpan: number[] = new Array(rows.length).fill(0);
  {
    let i = 0;
    while (i < rows.length) {
      let j = i;
      while (j < rows.length && rows[j].area === rows[i].area) j++;
      areaSpan[i] = j - i;
      i = j;
    }
    i = 0;
    while (i < rows.length) {
      let j = i;
      while (j < rows.length && rows[j].area === rows[i].area && rows[j].subGoal === rows[i].subGoal) j++;
      subGoalSpan[i] = j - i;
      i = j;
    }
  }

  const headerField = (key: string, def: string, w?: number) => (
    <input value={f(key, def)} onChange={e => setF(key, e.target.value)}
      style={{ ...niS, width: w ? w : '100%', boxSizing:'border-box' }} />
  );

  return (
    <div style={{ background:'#fff', border:cb, borderRadius:6, overflow:'hidden' }}>
      {/* ── Title ── */}
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'8px 14px 4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:12, color:'#334155', fontWeight:600 }}>급여제공계획서 번호 :</span>
          {headerField('cpd_docNo', 'L00102137000003', 170)}
        </div>
      </div>

      {/* ── Header table 1 ── */}
      <div style={{ padding:'0 14px' }}>
        <table style={{ ...ntbl, borderTop:cb }}>
          <colgroup>
            <col style={{ width:'20%' }} /><col style={{ width:'30%' }} />
            <col style={{ width:'20%' }} /><col style={{ width:'30%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>장기요양등급</td>
              <td style={nvS}>
                <select value={String(f('cpd_grade', '4등급'))} onChange={e => setF('cpd_grade', e.target.value)}
                  style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 }}>
                  {['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </td>
              <td style={nlS}>장기요양인정유효기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_validStart', '2025-09-23')}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_validEnd', '2027-09-22')}
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>개인별장기요양이용계획서 번호</td>
              <td style={nvS} colSpan={3}>{headerField('cpd_planNo', 'L0010213700101-001')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Header table 2 ── */}
      <div style={{ padding:'6px 14px 0' }}>
        <table style={{ ...ntbl, borderTop:cb }}>
          <colgroup>
            <col style={{ width:'20%' }} /><col style={{ width:'30%' }} />
            <col style={{ width:'20%' }} /><col style={{ width:'30%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>장기요양급여종류</td>
              <td style={nvS}>
                <select value={String(f('cpd_svcType', '방문요양'))} onChange={e => setF('cpd_svcType', e.target.value)}
                  style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 }}>
                  {['방문요양','방문목욕','방문간호','주간보호'].map(v=>(
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </td>
              <td style={nlS}>장기요양급여계약일</td>
              <td style={nvS}>{dateField('cpd_contractDate', '2025-09-23')}</td>
            </tr>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>장기요양급여계약기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_contractStart', '2025-09-23')}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_contractEnd', '2027-09-22')}
                </div>
              </td>
              <td style={nlS}>급여제공계획서 적용기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_applyStart', '2026-06-15')}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_applyEnd', '2027-09-22')}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 목표 block ── */}
      <div style={{ padding:'10px 14px 0' }}>
        <table style={ntbl}>
          <colgroup>
            <col style={{ width:'16%' }} /><col style={{ width:'84%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...nlS, borderLeft:cb, borderTop:cb }}>목표</td>
              <td style={{ ...nvS, borderTop:cb }}>
                <textarea value={f('cpd_goals', DEFAULT_GOALS)} onChange={e => setF('cpd_goals', e.target.value)}
                  style={{ ...ntS, minHeight:110 }} rows={6} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Main service table ── */}
      <div style={{ padding:'12px 14px 0' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:6 }}>장기요양급여 제공내용</div>
        <table style={ntbl}>
          <colgroup>
            <col style={{ width:'13%' }} /><col style={{ width:'20%' }} />
            <col style={{ width:'17%' }} /><col style={{ width:'25%' }} />
            <col style={{ width:'11%' }} /><col style={{ width:'8%' }} /><col style={{ width:'6%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...thS, borderLeft:cb, borderTop:cb }}>장기요양<br/>필요영역</th>
              <th style={{ ...thS, borderTop:cb }}>장기요양세부목표</th>
              <th style={{ ...thS, borderTop:cb }}>장기요양필요내용</th>
              <th style={{ ...thS, borderTop:cb }}>세부제공 내용</th>
              <th style={{ ...thS, borderTop:cb }}>횟수<br/>(주기/회)</th>
              <th style={{ ...thS, borderTop:cb }}>시간<br/>(분)</th>
              <th style={{ ...thS, borderTop:cb }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const showArea = idx === 0 || rows[idx-1].area !== r.area;
              const showSub = showArea || rows[idx-1].subGoal !== r.subGoal;
              const btnStyle = { fontSize:10, fontWeight:700, border:'1px solid #86efac', borderRadius:3, padding:'2px 6px', cursor:'pointer', background:'#f0fdf4', color:'#166534', whiteSpace:'nowrap' as const };
              return (
                <tr key={idx}>
                  {showArea && (
                    <td style={{ ...tdS, borderLeft:cb, verticalAlign:'top' }} rowSpan={areaSpan[idx]}>
                      <AutoTA value={r.area} onChange={e => setRangeField(idx, areaSpan[idx], 'area', e.target.value)}
                        style={{ ...ntS, minHeight:32 }} minRows={2}/>
                      <div style={{ marginTop:4 }}>
                        <button onClick={() => addSubGoal(idx, areaSpan[idx])} style={btnStyle}>+ 세부목표 추가</button>
                      </div>
                    </td>
                  )}
                  {showSub && (
                    <td style={{ ...tdS, verticalAlign:'top' }} rowSpan={subGoalSpan[idx]}>
                      <AutoTA value={r.subGoal} onChange={e => setRangeField(idx, subGoalSpan[idx], 'subGoal', e.target.value)}
                        style={{ ...ntS, minHeight:48 }} minRows={3}/>
                      <div style={{ marginTop:4 }}>
                        <button onClick={() => addNeed(idx, subGoalSpan[idx])} style={btnStyle}>+ 필요내용 추가</button>
                      </div>
                    </td>
                  )}
                  <td style={tdS}>
                    <AutoTA value={r.need} onChange={e => updRow(idx, { need: e.target.value })}
                      style={{ ...ntS, minHeight:32 }} minRows={2}/>
                  </td>
                  <td style={tdS}>
                    <AutoTA value={r.detail} onChange={e => updRow(idx, { detail: e.target.value })}
                      style={{ ...ntS, minHeight:48 }} minRows={3}/>
                  </td>
                  <td style={tdS}>
                    <input value={r.freq} onChange={e => updRow(idx, { freq: e.target.value })} style={{ ...niS, width:'100%', boxSizing:'border-box' }} />
                  </td>
                  <td style={tdS}>
                    <input value={r.time} onChange={e => updRow(idx, { time: e.target.value })} style={{ ...niS, width:'100%', boxSizing:'border-box', textAlign:'center' }} />
                  </td>
                  <td style={{ ...tdS, textAlign:'center', verticalAlign:'middle' }}>
                    <button onClick={() => delRow(idx)} title="행 삭제"
                      style={{ fontSize:12, color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop:8 }}>
          <button onClick={addArea}
            style={{ fontSize:12, fontWeight:700, color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:4, padding:'5px 14px', cursor:'pointer' }}>+ 필요영역 추가</button>
        </div>
      </div>

      {/* ── 종합의견 ── */}
      <div style={{ padding:'14px 14px 0' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:6 }}>종합의견</div>
        <textarea value={f('cpd_opinion', DEFAULT_OPINION)} onChange={e => setF('cpd_opinion', e.target.value)}
          style={{ ...ntS, minHeight:360 }} rows={22} />
      </div>

    </div>
  );
}
