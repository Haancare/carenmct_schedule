import React, { useState, useEffect, useRef } from 'react';

function AutoTA({ value, onChange, style, minRows = 2 }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
  minRows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
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
import type { CSSProperties } from 'react';
import { BookOpen, CheckCircle2, Clock, X } from 'lucide-react';
import type { ConsultationVisit } from './mockData';
import { recipients, socialWorkers, getCertNo, getGuardians, getGradeNum, getGradeText } from './mockData';

// ── types ────────────────────────────────────────────────────────────────────
export type JournalStatus = 'draft' | 'completed';
export interface Journal {
  data: Record<string, any>;
  status: JournalStatus;
  writtenAt: string;
}
export interface JournalModalProps {
  visit: ConsultationVisit;
  data: Record<string, any>;
  setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  status: JournalStatus;
  setStatus: React.Dispatch<React.SetStateAction<JournalStatus>>;
  existing?: Journal;
  onSave: (status?: JournalStatus) => void;
  onClose: () => void;
}

export interface JournalFormBodyProps {
  data: Record<string, any>;
  setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  recipientId: string;
  socialWorkerId?: string;
  visitDate?: string;
  writtenAt?: string;
}


// ── styles (exactly matching CarePlanManagement) ─────────────────────────────
const cb = '1px solid #d1d5db';
const nlS: CSSProperties = { fontSize:12, color:'#1e293b', padding:'6px 10px', borderRight:cb, borderBottom:cb, background:'#f3f4f6', fontWeight:600, verticalAlign:'middle' };
const nvS: CSSProperties = { fontSize:12, color:'#1e293b', padding:'6px 10px', borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
const niS: CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 };
const ntS: CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', resize:'vertical' as const, padding:'4px 6px', lineHeight:1.6, borderRadius:3 };
const ntbl: CSSProperties = { width:'100%', borderCollapse:'collapse' as const, tableLayout:'fixed' as const };
const closeBtn: CSSProperties = { width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:4, cursor:'pointer', padding:0 };

const secH = (text: string) => <div style={{ fontSize:13, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>{text}</div>;

// ── Section 3 rows ──────────────────────────────────────────────────────────
const SEC3_ROWS = [
  { key: 'meal', label: '가. 식사 및 영양상태' },
  { key: 'walk', label: '나. 보행상태' },
  { key: 'body', label: '다. 신체기능상태' },
  { key: 'excr', label: '라. 배뇨·배변기능' },
  { key: 'hygn', label: '마. 위생관리' },
  { key: 'daily', label: '바. 일상생활수행' },
  { key: 'cogn', label: '사. 인지기능' },
  { key: 'bhvr', label: '아. 행동증상' },
  { key: 'fam', label: '자. 가족 및 생활환경' },
];

// ── Section 4 service rows ────────────────────────────────────────────────
const SEC4_ROWS = [
  { svc: '방문요양', areas: [
    { key: 'phys', label: '신체활동지원', defNeed: '세면, 구강청결, 몸단장, 머리감기, 옷갈아입기' },
    { key: 'cogn', label: '인지관리지원', defNeed: '' },
    { key: 'emot', label: '정서지원', defNeed: '말벗, 취미활동, 요리활동' },
    { key: 'life', label: '일상생활지원\n환경관리', defNeed: '식사준비 및 정리, 청소 및 주변정도, 의복세' },
    { key: 'pers', label: '개인활동지원', defNeed: '병원동행' },
  ]},
  { svc: '방문목욕', areas: [
    { key: 'bath', label: '전문목욕', defNeed: '' },
  ]},
  { svc: '방문간호', areas: [
    { key: 'hlth', label: '건강관리', defNeed: '' },
    { key: 'nurs', label: '간호관리', defNeed: '' },
  ]},
];

// ── JournalFormBody (exported – used inline in RecipientJournalTab) ──────────
export function JournalFormBody({ data, setData, recipientId, socialWorkerId, visitDate, writtenAt }: JournalFormBodyProps) {
  const TODAY_STR = '2026-04-13';
  const rec = recipients.find(r => r.id === recipientId);
  const sw  = socialWorkerId ? socialWorkers.find(s => s.id === socialWorkerId) : undefined;

  const f    = (k: string, def: any = '') => data[k] ?? def;
  const setF = (k: string, v: any) => setData(prev => ({ ...prev, [k]: v }));

  const chk = (key: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(key, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF(key, e.target.checked ? 1 : 0),
    style: { marginRight: 4, accentColor: '#16a34a' } as CSSProperties,
  });
  const rad = (key: string, val: string, def?: string) => ({
    type: 'radio' as const, name: key, checked: String(f(key, def ?? '')) === val,
    onChange: () => setF(key, val),
    style: { marginRight: 3, accentColor: '#16a34a' } as CSSProperties,
  });
  const nInp = (key: string, def: string = '', w?: number | string) => (
    <input value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={{ ...niS, width: w ?? '100%' }} />
  );
  const numI = (key: string, def: string = '', w: number | string = 50) => (
    <input value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={{ ...niS, width: w, textAlign: 'center' }} />
  );
  const txtA = (key: string, minRows = 3, def = '') => (
    <AutoTA minRows={minRows} value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={ntS} />
  );
  // 제공/미제공 상호배타 체크박스 (둘 다 해제 가능)
  const provChk = (key: string) => {
    const val = String(f(key, ''));
    return (
      <div style={{ display:'flex', flexDirection:'row', gap:5, alignItems:'center', justifyContent:'center', flexWrap:'nowrap' }}>
        <label style={{ fontSize:12, whiteSpace:'nowrap', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
          <input type="checkbox" checked={val === 'prov'}
            onChange={() => setF(key, val === 'prov' ? '' : 'prov')}
            style={{ accentColor:'#16a34a' }} />
          제공
        </label>
        <label style={{ fontSize:12, whiteSpace:'nowrap', cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
          <input type="checkbox" checked={val === 'noprov'}
            onChange={() => setF(key, val === 'noprov' ? '' : 'noprov')}
            style={{ accentColor:'#16a34a' }} />
          미제공
        </label>
      </div>
    );
  };
  // 양호/없음 체크 시 나머지 초기화, 나머지 체크 시 양호 해제
  const noneChk = (noneKey: string, subKeys: string[], textKeys: string[] = [], def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(noneKey, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(noneKey, e.target.checked ? 1 : 0);
      if (e.target.checked) { subKeys.forEach(k => setF(k, 0)); textKeys.forEach(k => setF(k, '')); }
    },
    style: { marginRight: 4, accentColor: '#16a34a' } as CSSProperties,
  });
  const subChk = (key: string, noneKey: string) => ({
    type: 'checkbox' as const, checked: !!f(key, 0),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setF(key, e.target.checked ? 1 : 0); if (e.target.checked) setF(noneKey, 0); },
    style: { marginRight: 4, accentColor: '#16a34a' } as CSSProperties,
  });
  const subEtcChk = (chkKey: string, valKey: string, noneKey: string) => ({
    type: 'checkbox' as const, checked: !!f(chkKey, 0),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setF(chkKey, e.target.checked ? 1 : 0); if (!e.target.checked) setF(valKey, ''); if (e.target.checked) setF(noneKey, 0); },
    style: { marginRight: 4, accentColor: '#16a34a' } as CSSProperties,
  });
  const subEtcInp = (chkKey: string, valKey: string, noneKey: string, def = '', w?: number | string) => {
    const dis = !f(chkKey, 0);
    return <input value={String(f(valKey, def))} onChange={e => { setF(valKey, e.target.value); if (e.target.value) setF(noneKey, 0); }} disabled={dis}
      style={{ ...niS, width: w ?? '100%', background: dis ? '#f3f4f6' : '#f9fbff', cursor: dis ? 'not-allowed' : undefined }} />;
  };
  const etcChk = (chkKey: string, valKey: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(chkKey, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(chkKey, e.target.checked ? 1 : 0);
      if (!e.target.checked) setF(valKey, '');
    },
    style: { marginRight: 4, accentColor: '#16a34a' } as CSSProperties,
  });
  const etcInp = (chkKey: string, valKey: string, def: string = '', w?: number | string) => {
    const dis = !f(chkKey, 0);
    return <input value={String(f(valKey, def))} onChange={e => setF(valKey, e.target.value)} disabled={dis}
      style={{ ...niS, width: w ?? '100%', background: dis ? '#f3f4f6' : '#f9fbff', cursor: dis ? 'not-allowed' : undefined }} />;
  };
  const vDate = visitDate ?? TODAY_STR;

  return (
    <div style={{ background:'#fff', border:'1px solid #d1d5db', borderRadius:4, overflow:'hidden' }}>

      {/* ═══ 1. 기본정보 ═══ */}
      {secH('1. 기본정보')}
      <table style={ntbl}><colgroup><col style={{width:'9%'}}/><col style={{width:'16%'}}/><col style={{width:'11%'}}/><col style={{width:'12%'}}/><col style={{width:'9%'}}/><col style={{width:'20%'}}/><col style={{width:'9%'}}/><col style={{width:'14%'}}/></colgroup><tbody>
        {/* 수급자명/업무수행일/인정번호/요양등급 한 줄 */}
        <tr>
          <td style={nlS}>수급자명</td>
          <td style={nvS}><span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{rec?.name ?? '-'}</span></td>
          <td style={nlS}>업무수행일</td>
          <td style={nvS}>{vDate}</td>
          <td style={nlS}>인정번호</td>
          <td style={nvS}>{rec ? getCertNo(rec) : '-'}</td>
          <td style={nlS}>요양등급</td>
          <td style={{...nvS, borderRight:'none'}}>
            <select value={String(f('j_grade', rec ? getGradeNum(rec) : '2'))} onChange={e => setF('j_grade', e.target.value)}
              style={{ ...niS, width:'100%' }}>
              {['1','2','3','4','5'].map(g => <option key={g} value={g}>{g}등급</option>)}
              <option value="인지지원">인지지원등급</option>
            </select>
          </td>
        </tr>
        <tr>
          <td style={nlS}>시간장소</td>
          <td colSpan={7} style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {(() => {
                const timeSel = (key: string, def: string) => {
                  const val = String(f(key, def));
                  const [hh, mm] = val.split(':').map(Number);
                  const selSt: React.CSSProperties = { ...niS, width:48, textAlign:'center', padding:'3px 2px' };
                  return (
                    <span style={{ display:'flex', alignItems:'center', gap:2 }}>
                      <select value={isNaN(hh) ? def.split(':')[0] : String(hh).padStart(2,'0')}
                        onChange={e => setF(key, `${e.target.value}:${isNaN(mm)?def.split(':')[1]:String(mm).padStart(2,'0')}`)}
                        style={selSt}>
                        {Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).map(h=><option key={h} value={h}>{h}</option>)}
                      </select>
                      <span style={{fontSize:12}}>시</span>
                      <select value={isNaN(mm) ? def.split(':')[1] : String(mm).padStart(2,'0')}
                        onChange={e => setF(key, `${isNaN(hh)?def.split(':')[0]:String(hh).padStart(2,'0')}:${e.target.value}`)}
                        style={selSt}>
                        {Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                      <span style={{fontSize:12}}>분</span>
                    </span>
                  );
                };
                return <>{timeSel('j_startTime','12:00')} <span style={{fontSize:12}}>~</span> {timeSel('j_endTime','13:00')}</>;
              })()}
              <label style={{ fontSize:12, marginLeft:8 }}><input {...chk('j_loc_during')} />급여제공 중 방문</label>
              <label style={{ fontSize:12 }}><input {...chk('j_loc_home', 1)} />수급자 자택</label>
              <label style={{ fontSize:12 }}><input {...etcChk('j_loc_other','j_loc_otherText')} />기타 장소 (</label>
              {etcInp('j_loc_other','j_loc_otherText','',80)}<span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>불가사유</td>
          <td colSpan={7} style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {([
                { val:'death', label:'사망' },
                { val:'hosp',  label:'입원' },
                { val:'end',   label:'월 중 급여제공 종료' },
                { val:'etc',   label:'기타' },
              ] as const).map(({ val, label }) => {
                const cur = String(f('j_na_reason',''));
                const checked = cur === val;
                return (
                  <label key={val} style={{ fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}>
                    <input type="checkbox" checked={checked}
                      onChange={() => {
                        if (checked) {
                          // 해제 → 모두 초기화
                          setF('j_na_reason', '');
                          setF('j_na_etcText', '');
                          setF('j_na_memo', '');
                        } else {
                          setF('j_na_reason', val);
                          if (val !== 'etc') setF('j_na_etcText', '');
                        }
                      }}
                      style={{ accentColor:'#16a34a' }} />
                    {label}
                  </label>
                );
              })}
              <input value={String(f('j_na_etcText',''))} onChange={e=>setF('j_na_etcText',e.target.value)}
                disabled={String(f('j_na_reason',''))!=='etc'}
                style={{...niS,width:120,background:String(f('j_na_reason',''))!=='etc'?'#f3f4f6':'#f9fbff',cursor:String(f('j_na_reason',''))!=='etc'?'not-allowed':undefined}}/>
            </div>
            <div style={{ marginTop:4, display:'flex', alignItems:'flex-start', gap:6 }}>
              <span style={{ fontSize:12, color:'#374151', fontWeight:600, whiteSpace:'nowrap', paddingTop:5 }}>내용</span>
              <AutoTA minRows={1} value={String(f('j_na_memo',''))} onChange={e => setF('j_na_memo', e.target.value)} style={{...ntS, flex:1}} />
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>방문자명</td>
          <td style={nvS}>{nInp('j_visitor', sw?.name ?? '', '100%')}</td>
          <td style={nlS}>시설장명</td>
          <td style={nvS}>{nInp('j_director', '', '100%')}</td>
          <td style={nlS}>보호자명</td>
          <td style={nvS}>{nInp('j_guardian', rec ? (getGuardians(rec)[0]?.name ?? '') : '', '100%')}</td>
          <td style={nlS}>제공자명</td>
          <td style={{...nvS, borderRight:'none'}}>{nInp('j_provider', sw?.name ?? '', '100%')}</td>
        </tr>
      </tbody></table>

      {/* ═══ 2. 욕구조사 ═══ */}
      {secH('2. 욕구조사')}
      <table style={ntbl}><colgroup><col style={{width:'12%'}}/><col/></colgroup><tbody>
        {/* 가. 보유질환 */}
        <tr>
          <td style={nlS}>가. 보유질환</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input type="radio" name="j_dis_yn" checked={String(f('j_dis_yn','none'))==='none'} onChange={()=>{ setF('j_dis_yn','none'); setF('j_dis_detail',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>없음</label>
              <label style={{ fontSize:12 }}>
                <input type="radio" name="j_dis_yn" checked={String(f('j_dis_yn','none'))==='yes'} onChange={()=>setF('j_dis_yn','yes')} style={{marginRight:3,accentColor:'#16a34a'}}/>있음 (
              </label>
              <input value={String(f('j_dis_detail','뇌졸중, 치매, 고혈압, 관절염, 골다공증'))} onChange={e=>{ setF('j_dis_detail',e.target.value); if(e.target.value) setF('j_dis_yn','yes'); }}
                disabled={String(f('j_dis_yn','none'))!=='yes'}
                style={{...niS,width:300,background:String(f('j_dis_yn','none'))!=='yes'?'#f3f4f6':'#f9fbff',cursor:String(f('j_dis_yn','none'))!=='yes'?'not-allowed':undefined}}/>
              <span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        {/* 나. 영양상태 */}
        <tr>
          <td style={nlS}>나. 영양상태</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input {...noneChk('j_nut_양호',['j_nut_식욕부진','j_nut_체중감소','j_nut_체중과다','j_nut_etc'],['j_nut_etcText'])} />양호</label>
              {['식욕부진','체중감소','체중과다'].map(v => (
                <label key={v} style={{ fontSize:12 }}><input {...subChk(`j_nut_${v}`,'j_nut_양호')} />{v}</label>
              ))}
              <label style={{ fontSize:12 }}><input {...subEtcChk('j_nut_etc','j_nut_etcText','j_nut_양호')} />기타 (</label>{subEtcInp('j_nut_etc','j_nut_etcText','j_nut_양호','',80)}<span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        {/* 다. 보행상태 */}
        <tr>
          <td style={nlS}>다. 보행상태</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              {[
                { v:'1', l:'자립보행 가능' },
                { v:'2', l:'보장구를 사용하여 자립보행 가능' },
                { v:'3', l:'부축해주면 보행 가능' },
                { v:'4', l:'보장구를 사용하며 부축을 받아 보행 가능' },
                { v:'5', l:'보행 불가' },
              ].map(o => (
                <label key={o.v} style={{ fontSize:12 }}><input {...rad('j_walk', o.v)} />{o.l}</label>
              ))}
            </div>
          </td>
        </tr>
        {/* 라. 일어서기 */}
        <tr>
          <td style={nlS}>라. 일어서기</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {[{v:'0',l:'혼자수행'},{v:'1',l:'지시(준비)도움'},{v:'2',l:'직접(부축)도움'},{v:'3',l:'전혀 수행할 수 없음'}].map(o => (
                <label key={o.v} style={{ fontSize:12 }}><input {...rad('j_standup', o.v)} />{o.l}</label>
              ))}
            </div>
          </td>
        </tr>
        {/* 마. 일어앉기 */}
        <tr>
          <td style={nlS}>마. 일어앉기</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {[{v:'0',l:'혼자수행'},{v:'1',l:'지시(준비)도움'},{v:'2',l:'직접(부축)도움'},{v:'3',l:'전혀 수행할 수 없음'}].map(o => (
                <label key={o.v} style={{ fontSize:12 }}><input {...rad('j_situp', o.v)} />{o.l}</label>
              ))}
            </div>
          </td>
        </tr>
        {/* 바. 배뇨기능 */}
        <tr>
          <td style={nlS}>바. 배뇨기능</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input {...noneChk('j_urine_양호',['j_urine_요실금','j_urine_배뇨곤란(배뇨 시 통증, 배뇨지연 등)','j_urine_요의 느끼지 못함','j_urine_etc'],['j_urine_etcText'])} />양호</label>
              {['요실금','배뇨곤란(배뇨 시 통증, 배뇨지연 등)','요의 느끼지 못함'].map(v => (
                <label key={v} style={{ fontSize:12 }}><input {...subChk(`j_urine_${v}`,'j_urine_양호')} />{v}</label>
              ))}
              <label style={{ fontSize:12 }}><input {...subEtcChk('j_urine_etc','j_urine_etcText','j_urine_양호')} />기타 (</label>{subEtcInp('j_urine_etc','j_urine_etcText','j_urine_양호','',80)}<span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        {/* 사. 배변기능 */}
        <tr>
          <td style={nlS}>사. 배변기능</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {['양호','변실금','잦은 설사','변비','변의 느끼지 못함'].map(v => (
                <label key={v} style={{ fontSize:12 }}><input {...chk(`j_bowel_${v}`)} />{v}</label>
              ))}
              <label style={{ fontSize:12 }}><input {...etcChk('j_bowel_etc','j_bowel_etcText')} />기타 (</label>{etcInp('j_bowel_etc','j_bowel_etcText','',80)}<span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        {/* 아. 일상생활 */}
        <tr>
          <td style={nlS}>아. 일상생활</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ fontSize:11, color:'#6b7280', marginBottom:6 }}>[ 0: 혼자 할 수 있음, 1: 지시(준비)도움, 2: 직접(부축)도움, 3: 전혀 수행할 수 없음 ]</div>
            {(() => {
              const adlBtn = (key: string) => {
                const cur = String(f(key, ''));
                return (
                  <div style={{ display:'flex', gap:3 }}>
                    {['0','1','2','3'].map(v => (
                      <button key={v} type="button" onClick={() => setF(key, cur === v ? '' : v)}
                        style={{ width:24, height:24, borderRadius:4, border:`1px solid ${cur===v?'#2563eb':'#d1d5db'}`,
                          background: cur===v?'#2563eb':'#f9fbff', color: cur===v?'#fff':'#475569',
                          fontSize:12, fontWeight:700, cursor:'pointer', padding:0 }}>{v}</button>
                    ))}
                  </div>
                );
              };
              return (
                <table style={{ borderCollapse:'collapse' }}><tbody>
                  <tr>
                    <td style={{ fontSize:12, padding:'2px 8px 2px 0' }}>1) 식사하기</td>
                    <td style={{ padding:'2px 20px 2px 0' }}>{adlBtn('j_adl_eat')}</td>
                    <td style={{ fontSize:12, padding:'2px 8px 2px 0' }}>3) 양치질하기(틀니관리)</td>
                    <td style={{ padding:'2px 0' }}>{adlBtn('j_adl_brush')}</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize:12, padding:'2px 8px 2px 0' }}>2) 세수하기</td>
                    <td style={{ padding:'2px 20px 2px 0' }}>{adlBtn('j_adl_wash')}</td>
                    <td style={{ fontSize:12, padding:'2px 8px 2px 0' }}>4) 화장실(이동변기) 사용하기</td>
                    <td style={{ padding:'2px 0' }}>{adlBtn('j_adl_toilet')}</td>
                  </tr>
                </tbody></table>
              );
            })()}
          </td>
        </tr>
        {/* 자. 인지기능 */}
        <tr>
          <td style={nlS}>자. 인지기능</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input {...noneChk('j_cog_ok',['j_cog_mem','j_cog_mem_short','j_cog_mem_long','j_cog_orient','j_cog_orient_time','j_cog_orient_place','j_cog_orient_person','j_cog_judge','j_cog_understand','j_cog_attention'])} />양호</label>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('j_cog_mem',0)} onChange={e=>{ setF('j_cog_mem',e.target.checked?1:0); setF('j_cog_ok',0); if(!e.target.checked){setF('j_cog_mem_short',0);setF('j_cog_mem_long',0);} }} style={{marginRight:4,accentColor:'#16a34a'}}/>기억력저하 (
              </label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('j_cog_mem_short',0)} onChange={e=>{ setF('j_cog_mem_short',e.target.checked?1:0); if(e.target.checked){setF('j_cog_ok',0);setF('j_cog_mem',1);} }} disabled={!f('j_cog_mem',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('j_cog_mem',0)?'not-allowed':undefined}}/>단기</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('j_cog_mem_long',0)} onChange={e=>{ setF('j_cog_mem_long',e.target.checked?1:0); if(e.target.checked){setF('j_cog_ok',0);setF('j_cog_mem',1);} }} disabled={!f('j_cog_mem',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('j_cog_mem',0)?'not-allowed':undefined}}/>장기 )
              </label>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('j_cog_orient',0)} onChange={e=>{ setF('j_cog_orient',e.target.checked?1:0); setF('j_cog_ok',0); if(!e.target.checked){setF('j_cog_orient_time',0);setF('j_cog_orient_place',0);setF('j_cog_orient_person',0);} }} style={{marginRight:4,accentColor:'#16a34a'}}/>지남력저하 (
              </label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('j_cog_orient_time',0)} onChange={e=>{ setF('j_cog_orient_time',e.target.checked?1:0); if(e.target.checked){setF('j_cog_ok',0);setF('j_cog_orient',1);} }} disabled={!f('j_cog_orient',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('j_cog_orient',0)?'not-allowed':undefined}}/>시간</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('j_cog_orient_place',0)} onChange={e=>{ setF('j_cog_orient_place',e.target.checked?1:0); if(e.target.checked){setF('j_cog_ok',0);setF('j_cog_orient',1);} }} disabled={!f('j_cog_orient',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('j_cog_orient',0)?'not-allowed':undefined}}/>장소</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('j_cog_orient_person',0)} onChange={e=>{ setF('j_cog_orient_person',e.target.checked?1:0); if(e.target.checked){setF('j_cog_ok',0);setF('j_cog_orient',1);} }} disabled={!f('j_cog_orient',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('j_cog_orient',0)?'not-allowed':undefined}}/>사람 )</label>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:3 }}>
              <label style={{ fontSize:12 }}><input {...subChk('j_cog_judge','j_cog_ok')} />판단력 저하</label>
              <label style={{ fontSize:12 }}><input {...subChk('j_cog_understand','j_cog_ok')} />이해력 저하</label>
              <label style={{ fontSize:12 }}><input {...subChk('j_cog_attention','j_cog_ok')} />주의력 저하</label>
            </div>
          </td>
        </tr>
        {/* 차. 행동증상 */}
        <tr>
          <td style={nlS}>차. 행동증상</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <label style={{ fontSize:12 }}><input type="radio" name="j_bhvr_yn" checked={String(f('j_bhvr_yn','none'))==='none'} onChange={()=>{ setF('j_bhvr_yn','none'); setF('j_bhvr_detail',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>없음</label>
              <label style={{ fontSize:12 }}>
                <input type="radio" name="j_bhvr_yn" checked={String(f('j_bhvr_yn','none'))==='yes'} onChange={()=>setF('j_bhvr_yn','yes')} style={{marginRight:3,accentColor:'#16a34a'}}/>있음 (
              </label>
              <input value={String(f('j_bhvr_detail',''))} onChange={e=>{ setF('j_bhvr_detail',e.target.value); if(e.target.value) setF('j_bhvr_yn','yes'); }}
                disabled={String(f('j_bhvr_yn','none'))!=='yes'}
                style={{...niS,width:200,background:String(f('j_bhvr_yn','none'))!=='yes'?'#f3f4f6':'#f9fbff',cursor:String(f('j_bhvr_yn','none'))!=='yes'?'not-allowed':undefined}}/>
              <span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
        {/* 카. 동거인 */}
        <tr>
          <td style={nlS}>카. 동거인</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {['독거','배우자','자녀','며느리/사위','형제/자매','손자녀','부모','친척'].map(v => (
                <label key={v} style={{ fontSize:12 }}><input {...chk(`j_fam_${v}`)} />{v}</label>
              ))}
              <label style={{ fontSize:12 }}><input {...etcChk('j_fam_etc','j_fam_etcText')} />기타 (</label>{etcInp('j_fam_etc','j_fam_etcText','',80)}<span style={{ fontSize:12 }}>)</span>
            </div>
          </td>
        </tr>
      </tbody></table>

      {/* ═══ 3. 수급자의 심신상태 및 환경변화 ═══ */}
      {secH('3. 수급자의 심신상태 및 환경변화')}
      <table style={ntbl}><colgroup><col style={{width:'18%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col style={{width:'7%'}}/><col/></colgroup>
        <thead>
          <tr>
            <td style={{...nlS, textAlign:'center'}}>심신상태 구분</td>
            <td style={{...nlS, textAlign:'center'}}>유지</td>
            <td style={{...nlS, textAlign:'center'}}>악화</td>
            <td style={{...nlS, textAlign:'center'}}>호전</td>
            <td style={{...nlS, textAlign:'center', borderRight:'none'}}>판단근거</td>
          </tr>
        </thead>
        <tbody>
          {SEC3_ROWS.map(row => (
            <tr key={row.key}>
              <td style={{...nlS, fontWeight:500}}>{row.label}</td>
              {(['keep','worse','better'] as const).map(v => (
                <td key={v} style={{...nvS, textAlign:'center'}}>
                  <input type="checkbox"
                    checked={String(f(`j_s3_${row.key}`, '')) === v}
                    onChange={() => setF(`j_s3_${row.key}`, String(f(`j_s3_${row.key}`, '')) === v ? '' : v)}
                    style={{ accentColor:'#16a34a' }} />
                </td>
              ))}
              <td style={{...nvS, borderRight:'none'}}>{txtA(`j_s3_${row.key}_reason`, 1)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} style={{...nvS, borderRight:'none', padding:'8px 10px'}}>
              <div style={{ marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:600 }}>차. 기타 및 종합의견</span>
              </div>
              {txtA('j_s3_total', 4)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══ 4. 급여제공계획 및 제공내용 확인 ═══ */}
      {secH('4. 급여제공계획 및 제공내용 확인')}
      <table style={ntbl}><colgroup><col style={{width:'9%'}}/><col style={{width:'11%'}}/><col style={{width:'18%'}}/><col style={{width:'14%'}}/><col style={{width:'24%'}}/><col style={{width:'24%'}}/></colgroup>
        <thead>
          <tr>
            <td style={{...nlS, textAlign:'center'}}>급여종류</td>
            <td style={{...nlS, textAlign:'center'}}>필요영역</td>
            <td style={{...nlS, textAlign:'center'}}>필요내용</td>
            <td style={{...nlS, textAlign:'center'}}>제공여부</td>
            <td style={{...nlS, textAlign:'center'}}>확인내용</td>
            <td style={{...nlS, textAlign:'center', borderRight:'none'}}>미제공사유</td>
          </tr>
        </thead>
        <tbody>
          {SEC4_ROWS.map(svc => (
            svc.areas.map((area, ai) => (
              <tr key={`${svc.svc}_${area.key}`}>
                {ai === 0 && <td rowSpan={svc.areas.length} style={{...nlS, textAlign:'center', verticalAlign:'middle'}}>{svc.svc}</td>}
                <td style={{...nlS, textAlign:'center', fontWeight:500, whiteSpace:'pre-line' as const}}>{area.label}</td>
                <td style={nvS}>{txtA(`j_s4_${area.key}_need`, 2, area.defNeed)}</td>
                <td style={{...nvS, padding:'6px 4px', textAlign:'center'}}>
                  {provChk(`j_s4_${area.key}_provYn`)}
                </td>
                <td style={nvS}>{txtA(`j_s4_${area.key}_confirm`, 1)}</td>
                <td style={{...nvS, borderRight:'none'}}>{txtA(`j_s4_${area.key}_reason`, 1)}</td>
              </tr>
            ))
          ))}
        </tbody>
      </table>

      {/* ═══ 5. 인지활동형프로그램 제공내용 확인 ═══ */}
      {secH('5. 인지활동형프로그램 제공내용 확인')}
      <table style={ntbl}><colgroup><col style={{width:'11%'}}/><col style={{width:'17%'}}/><col style={{width:'14%'}}/><col style={{width:'19%'}}/><col style={{width:'19%'}}/><col style={{width:'20%'}}/></colgroup>
        <thead>
          <tr>
            <td style={{...nlS, textAlign:'center'}}>프로그램</td>
            <td style={{...nlS, textAlign:'center'}}>제공계획</td>
            <td style={{...nlS, textAlign:'center'}}>제공여부</td>
            <td style={{...nlS, textAlign:'center'}}>확인내용</td>
            <td style={{...nlS, textAlign:'center'}}>미제공사유</td>
            <td style={{...nlS, textAlign:'center', borderRight:'none'}}>향후계획</td>
          </tr>
        </thead>
        <tbody>
          {[
            { key:'cogn', label:'인지자극' },
            { key:'daily', label:'일상생활' },
          ].map(prog => (
            <tr key={prog.key}>
              <td style={{...nlS, textAlign:'center', fontWeight:500}}>
                {prog.label}
              </td>
              <td style={nvS}>{txtA(`j_s5_${prog.key}_plan`, 3)}</td>
              <td style={{...nvS, padding:'6px 4px', textAlign:'center'}}>
                {provChk(`j_s5_${prog.key}_provYn`)}
              </td>
              <td style={nvS}>{txtA(`j_s5_${prog.key}_confirm`, 1)}</td>
              <td style={nvS}>{txtA(`j_s5_${prog.key}_reason`, 1)}</td>
              <td style={{...nvS, borderRight:'none'}}>{txtA(`j_s5_${prog.key}_future`, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ═══ 6. 수급자(보호자) 상담 ═══ */}
      {secH('6. 수급자(보호자) 상담')}
      <div style={{ padding:'6px 10px', borderBottom:cb }}>
        {txtA('j_s6_consult', 5)}
      </div>

      {/* ═══ 7. 향후계획 및 기타사항 ══ */}
      <div style={{ padding:'8px 10px', borderBottom:cb }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#166534' }}>7. 향후계획 및 기타사항</span>
      </div>
      <table style={ntbl}><colgroup><col style={{width:'12%'}}/><col/></colgroup><tbody>
        <tr>
          <td style={nlS}>수급자 욕구</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input {...chk('j_s7_needChange')} />서비스 욕구 변화 있음</label>
              <label style={{ fontSize:12 }}><input {...chk('j_s7_needNoChange')} />변화 없음</label>
              <label style={{ fontSize:12 }}><input {...chk('j_s7_statusChange')} />수급자 심신상태 등 변화 있음</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>재작성 여부</td>
          <td style={{...nvS, borderRight:'none'}}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <label style={{ fontSize:12 }}><input {...chk('j_s7_keepPlan')} />급여제공계획 유지</label>
              <label style={{ fontSize:12 }}><input {...chk('j_s7_rewrite')} />욕구조사 재실시 및 급여제공계획서 재작성</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>급여제공 관련<br/>유의사항 및<br/>세부계획</td>
          <td style={{...nvS, borderRight:'none', padding:'8px 10px'}}>
            {txtA('j_s7_notes', 4)}
          </td>
        </tr>
      </tbody></table>

      {writtenAt && (
        <div style={{ fontSize:10, color:'#94a3b8', textAlign:'right', padding:'4px 10px' }}>마지막 수정: {writtenAt}</div>
      )}

    </div>
  );
}

// ── main modal ─────────────────────────────────────────────────────────────────
export function JournalModal({ visit, data, setData, status, setStatus, existing, onSave, onClose }: JournalModalProps) {
  const rec = recipients.find(r => r.id === visit.recipientId);
  const sw = socialWorkers.find(s => s.id === visit.socialWorkerId);
  const timeLabel = visit.plannedEndTime ? `${visit.plannedStartTime} ~ ${visit.plannedEndTime}` : visit.plannedStartTime;

  // 급여제공계획관리 우측 문서 영역 너비와 일치시키기
  // CarePlanManagement: 좌측패널 440px + padding 14px*2 = 468px, maxWidth 800
  // 모달 body padding: 16px*2 = 32px → 모달 너비 = 문서콘텐츠(800) + 32 = 832px (max)
  const [modalW, setModalW] = useState<number>(832);
  useEffect(() => {
    const calc = () => {
      const cpContent = Math.min(window.innerWidth - 440 - 28, 800);
      setModalW(cpContent + 32);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(15,39,68,0.48)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position:'fixed', top:'50%', left:'50%', zIndex:501, transform:'translate(-50%,-50%)', width:modalW, maxHeight:'92vh', background:'#fff', borderRadius:10, boxShadow:'0 24px 64px rgba(15,39,68,0.28)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* ── HEADER ── */}
        <div style={{ background:'linear-gradient(90deg,#0f2744,#1a3a5c)', padding:'10px 14px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BookOpen size={14} color="#93c5fd" />
            <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>업무수행일지</span>
            <span style={{ width:1, height:12, background:'rgba(255,255,255,0.3)', display:'inline-block', margin:'0 3px' }} />
            <span style={{ fontSize:11, color:'#bfdbfe' }}>{rec?.name}</span>
            <span style={{ fontSize:11, color:'#93c5fd' }}>{visit.date}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <button onClick={onClose} style={closeBtn}><X size={11} color="#e0eaff" strokeWidth={2.5} /></button>
          </div>
        </div>

        {/* ── SUB HEADER ── */}
        <div style={{ flexShrink:0, background:'#f8fafc', borderBottom:'1px solid #e2e8f0', padding:'6px 16px', display:'flex', alignItems:'center', flexWrap:'wrap' }}>
          {[
            { label: '수급자', value: `${rec?.name ?? '-'} (${rec ? getGradeText(rec) : '-'})` },
            { label: '사회복지사', value: sw?.name ?? '-' },
            { label: '방문일자', value: visit.date },
            { label: '방문시간', value: timeLabel },
          ].map((item, i) => (
            <span key={i} style={{ display:'flex', alignItems:'center', marginRight:12 }}>
              <span style={{ fontSize:10, color:'#64748b', fontWeight:600, marginRight:4 }}>{item.label}</span>
              <span style={{ fontSize:11, color:'#1e293b' }}>{item.value}</span>
              {i < 3 && <span style={{ margin:'0 8px', color:'#e2e8f0' }}>|</span>}
            </span>
          ))}
        </div>

        {/* ── BODY (scrollable) ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
          <JournalFormBody
            data={data}
            setData={setData}
            recipientId={visit.recipientId}
            socialWorkerId={visit.socialWorkerId}
            visitDate={visit.date}
            writtenAt={existing?.writtenAt}
          />
        </div>

        {/* ── FOOTER ── */}
        <div style={{ flexShrink:0, padding:'10px 16px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:10, color:'#94a3b8' }}>{!existing ? '신규 작성' : `최초 작성일: ${existing.writtenAt}`}</div>
          <div style={{ display:'flex', gap:7 }}>
            <button onClick={onClose} style={{ padding:'6px 14px', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0' }}>닫기</button>
            <button onClick={() => onSave('completed')} style={{ padding:'6px 18px', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer', background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', border:'none' }}>저장</button>
          </div>
        </div>
      </div>
    </>
  );
}