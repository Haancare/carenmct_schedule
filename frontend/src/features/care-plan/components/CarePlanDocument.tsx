import React from 'react';
import {
  getCertNo,
  getGradeText,
  getValidFrom,
  getValidTo,
  type CarePlanUiRecipient,
} from '../utils/recipientHelpers';

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
  recipient?: CarePlanUiRecipient | null;
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

const EMPTY_ROW: SvcRow = {
  svcType: '방문요양',
  area: '',
  subGoal: '',
  need: '',
  detail: '',
  freq: '',
  time: '',
  writer: '',
};

const cb = '1px solid #d1d5db';
const nlS: React.CSSProperties = { fontSize:11, color:'#1e293b', padding:'6px 8px', borderRight:cb, borderBottom:cb, background:'#f3f4f6', fontWeight:600, verticalAlign:'middle', whiteSpace:'nowrap' };
const nvS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'6px 10px', borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
const niS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 };
const ntS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', resize:'vertical' as const, padding:'4px 6px', lineHeight:1.6, borderRadius:3 };
const ntbl: React.CSSProperties = { width:'100%', borderCollapse:'collapse' as const, tableLayout:'fixed' as const };
const thS: React.CSSProperties = { fontSize:12, fontWeight:700, color:'#1e293b', padding:'6px 6px', borderRight:cb, borderBottom:cb, background:'#f3f4f6', verticalAlign:'middle', textAlign:'center' as const };
const tdS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'4px 6px', borderRight:cb, borderBottom:cb, verticalAlign:'top' };

function gradeOption(recipient?: CarePlanUiRecipient | null): string {
  if (!recipient) return '';
  const t = getGradeText(recipient);
  if (!t) return '';
  if (t.includes('인지')) return '인지지원등급';
  const m = t.match(/(\d)/);
  return m ? `${m[1]}등급` : t;
}

export function CarePlanDocument({ formDraft, setF, recipient }: CarePlanDocumentProps) {
  const f = (key: string, def: any = '') => formDraft[key] ?? def;

  const dateField = (key: string, def: string) => (
    <input value={String(f(key, def))} placeholder="YYYY-MM-DD" maxLength={10}
      onChange={e => {
        const d = e.target.value.replace(/\D/g,'').slice(0,8);
        setF(key, d.length>6 ? d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6) : d.length>4 ? d.slice(0,4)+'-'+d.slice(4) : d);
      }}
      style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3, width:'100%' }}/>
  );

  const rows: SvcRow[] = (() => {
    const v = formDraft['cpd_rows'];
    if (Array.isArray(v)) return v as SvcRow[];
    if (typeof v === 'string') { try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch {} }
    return [{ ...EMPTY_ROW }];
  })();

  const setRows = (next: SvcRow[]) => setF('cpd_rows', next);
  const updRow = (idx: number, patch: Partial<SvcRow>) => {
    const next = rows.map((r, i) => i === idx ? { ...r, ...patch } : r);
    setRows(next);
  };
  const delRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  const addArea = () => {
    setRows([...rows, { ...EMPTY_ROW }]);
  };
  const addSubGoal = (startIdx: number, span: number) => {
    const area = rows[startIdx].area;
    const next = [...rows];
    next.splice(startIdx + span, 0, { ...EMPTY_ROW, area });
    setRows(next);
  };
  const addNeed = (startIdx: number, span: number) => {
    const { area, subGoal } = rows[startIdx];
    const next = [...rows];
    next.splice(startIdx + span, 0, { ...EMPTY_ROW, area, subGoal });
    setRows(next);
  };

  const setRangeField = (startIdx: number, count: number, field: keyof SvcRow, val: string) => {
    const next = rows.map((r, i) => (i >= startIdx && i < startIdx + count) ? { ...r, [field]: val } : r);
    setRows(next);
  };

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

  const certNo = recipient ? getCertNo(recipient) : '';
  const gradeDef = gradeOption(recipient);
  const validStart = recipient ? getValidFrom(recipient) : '';
  const validEnd = recipient ? getValidTo(recipient) : '';

  return (
    <div style={{ background:'#fff', border:cb, borderRadius:6, overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'8px 14px 4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:12, color:'#334155', fontWeight:600 }}>급여제공계획서 번호 :</span>
          {headerField('cpd_docNo', '', 170)}
        </div>
      </div>

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
                <select value={String(f('cpd_grade', gradeDef))} onChange={e => setF('cpd_grade', e.target.value)}
                  style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 }}>
                  <option value="">선택</option>
                  {['1등급','2등급','3등급','4등급','5등급','인지지원등급'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </td>
              <td style={nlS}>장기요양인정유효기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_validStart', validStart)}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_validEnd', validEnd)}
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>개인별장기요양이용계획서 번호</td>
              <td style={nvS} colSpan={3}>{headerField('cpd_planNo', certNo ? `L${certNo.replace(/^L/i, '')}` : '')}</td>
            </tr>
          </tbody>
        </table>
      </div>

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
                <select value={String(f('cpd_svcType', ''))} onChange={e => setF('cpd_svcType', e.target.value)}
                  style={{ fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 }}>
                  <option value="">선택</option>
                  {['방문요양','방문목욕','방문간호','주간보호'].map(v=>(
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </td>
              <td style={nlS}>장기요양급여계약일</td>
              <td style={nvS}>{dateField('cpd_contractDate', '')}</td>
            </tr>
            <tr>
              <td style={{ ...nlS, borderLeft:cb }}>장기요양급여계약기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_contractStart', '')}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_contractEnd', '')}
                </div>
              </td>
              <td style={nlS}>급여제공계획서 적용기간</td>
              <td style={nvS}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {dateField('cpd_applyStart', '')}
                  <span style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>~</span>
                  {dateField('cpd_applyEnd', '')}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ padding:'10px 14px 0' }}>
        <table style={ntbl}>
          <colgroup>
            <col style={{ width:'16%' }} /><col style={{ width:'84%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ ...nlS, borderLeft:cb, borderTop:cb }}>목표</td>
              <td style={{ ...nvS, borderTop:cb }}>
                <textarea value={f('cpd_goals', '')} onChange={e => setF('cpd_goals', e.target.value)}
                  style={{ ...ntS, minHeight:110 }} rows={6} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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

      <div style={{ padding:'14px 14px 0' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:6 }}>종합의견</div>
        <textarea value={f('cpd_opinion', '')} onChange={e => setF('cpd_opinion', e.target.value)}
          style={{ ...ntS, minHeight:360 }} rows={22} />
      </div>

    </div>
  );
}
