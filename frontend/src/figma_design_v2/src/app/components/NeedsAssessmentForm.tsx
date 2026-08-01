import React from 'react';

interface NeedsAssessmentFormProps {
  formDraft: Record<string, any>;
  setF: (k: string, v: any) => void;
}

export function NeedsAssessmentForm({ formDraft, setF }: NeedsAssessmentFormProps) {
  const f = (key: string, def: any = '') => formDraft[key] ?? def;
  const setIsDirty = (_: boolean) => {}; // setF already marks dirty internally

  const cb = '1px solid #d1d5db';
  const hBg = '#f3f4f6';
  const cp = '6px 10px';
  const nlS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:cp, borderRight:cb, borderBottom:cb, background:hBg, fontWeight:600, verticalAlign:'middle' };
  const nvS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:cp, borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
  const niS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', outline:'none', padding:'3px 6px', borderRadius:3 };
  const ntS: React.CSSProperties = { fontSize:13, border:'1px solid #d1d5db', background:'#f9fbff', color:'#1e293b', width:'100%', outline:'none', resize:'vertical', padding:'4px 6px', lineHeight:1.6, borderRadius:3 };
  const ntbl: React.CSSProperties = { width:'100%', borderCollapse:'collapse', tableLayout:'fixed' };
  const chk = (key: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(key, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF(key, e.target.checked ? 1 : 0),
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  // 가. 보유질환 관련 필드 목록 (없음 체크 시 초기화 대상)
  const DISEASE_KEYS = [
    'nd_d_stroke','nd_d_dementia','nd_d_parkinson','nd_d_depression',
    'nd_d_hypertension','nd_d_angina','nd_d_heartAttack','nd_d_asthma','nd_d_copd',
    'nd_d_diabetes','nd_d_hyperlipid',
    'nd_d_arthritis','nd_d_osteoporosis','nd_d_fracture',
    'nd_d_renalFail','nd_d_uriInfect','nd_d_bladder','nd_d_prostate',
    'nd_d_cataract','nd_d_glaucoma','nd_d_deaf','nd_d_macular','nd_d_otherEye',
    'nd_inf_tb','nd_inf_scabies','nd_inf_mrsa',
    'nd_cancer','nd_allergy','nd_otherDisease',
  ];
  // 보유질환 체크박스 — 변경 시 "없음" 자동 해제
  const dChk = (key: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(key, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(key, e.target.checked ? 1 : 0);
      setF('nd_d_noneAll', 0);
      setIsDirty(true);
    },
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  // 보유질환 텍스트 입력 — 입력 시 "없음" 자동 해제
  const dNInp = (key: string, def: string = '', w?: number | string) => (
    <input value={String(f(key, def))} onChange={e => { setF(key, e.target.value); setF('nd_d_noneAll', 0); setIsDirty(true); }} style={{ ...niS, width: w ?? '100%' }}/>
  );

  // 나. 복약 및 의료이용 — 변경 시 "복용하는 약이 없음" 자동 해제
  const mChk = (key: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(key, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(key, e.target.checked ? 1 : 0);
      setF('nd_noMed', 0);
      setIsDirty(true);
    },
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  const mNInp = (key: string, def: string = '', w?: number | string) => (
    <input value={String(f(key, def))} onChange={e => { setF(key, e.target.value); setF('nd_noMed', 0); setIsDirty(true); }} style={{ ...niS, width: w ?? '100%' }}/>
  );
  const mNumI = (key: string, def: number | string = '', w: number | string = 50) => (
    <input value={String(f(key, def))} onChange={e => { setF(key, e.target.value); setF('nd_noMed', 0); setIsDirty(true); }} style={{ ...niS, width: w, textAlign:'center' }}/>
  );

  const rad = (key: string, val: string, def?: string) => ({
    type: 'radio' as const, name: key, checked: String(f(key, def ?? '')) === val,
    onChange: () => setF(key, val),
    style: { marginRight: 3, accentColor:'#16a34a' } as React.CSSProperties,
  });
  const nInp = (key: string, def: string = '', w?: number | string) => (
    <input value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={{ ...niS, width: w ?? '100%' }}/>
  );
  const etcChk = (chkKey: string, valKey: string) => ({
    type: 'checkbox' as const,
    checked: !!f(chkKey, 0),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(chkKey, e.target.checked ? 1 : 0);
      if (!e.target.checked) setF(valKey, '');
      setIsDirty(true);
    },
    style: { marginRight: 4, accentColor: '#16a34a' } as React.CSSProperties,
  });
  const etcInp = (chkKey: string, valKey: string, def: string = '', w?: number | string) => {
    const dis = !f(chkKey, 0);
    return <input value={String(f(valKey, def))} onChange={e => setF(valKey, e.target.value)} disabled={dis}
      style={{ ...niS, width: w ?? '100%', background: dis ? '#f3f4f6' : '#f9fbff', cursor: dis ? 'not-allowed' : undefined }}/>;
  };
  // 없음/세부항목 연동 공용 헬퍼
  const jtNoneChk = (noneKey: string, subKeys: string[], partKeys?: string | string[], def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(noneKey, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(noneKey, e.target.checked ? 1 : 0);
      if (e.target.checked) {
        subKeys.forEach(k => setF(k, 0));
        (Array.isArray(partKeys) ? partKeys : partKeys ? [partKeys] : []).forEach(k => setF(k, ''));
      }
    },
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  const jtSubChk = (key: string, noneKey: string, def: number = 0) => ({
    type: 'checkbox' as const, checked: !!f(key, def),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(key, e.target.checked ? 1 : 0);
      if (e.target.checked) setF(noneKey, 0);
    },
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  const jtPartInp = (partKey: string, noneKey: string, def: string = '', w?: number | string) => (
    <input value={String(f(partKey, def))} onChange={e => { setF(partKey, e.target.value); if (e.target.value) setF(noneKey, 0); }}
      style={{ ...niS, width: w ?? '100%' }}/>
  );
  // 간호관리 기타 체크+입력 (없음 연동 포함)
  const nrsEtcChk = (chkKey: string, valKey: string, noneKey: string) => ({
    type: 'checkbox' as const, checked: !!f(chkKey, 0),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setF(chkKey, e.target.checked ? 1 : 0);
      if (!e.target.checked) setF(valKey, '');
      if (e.target.checked) setF(noneKey, 0);
    },
    style: { marginRight: 4, accentColor:'#16a34a' } as React.CSSProperties,
  });
  const nrsEtcInp = (chkKey: string, valKey: string, noneKey: string, def: string = '', w?: number | string) => {
    const dis = !f(chkKey, 0);
    return <input value={String(f(valKey, def))} onChange={e => { setF(valKey, e.target.value); if (e.target.value) setF(noneKey, 0); }} disabled={dis}
      style={{ ...niS, width: w ?? '100%', background: dis ? '#f3f4f6' : '#f9fbff', cursor: dis ? 'not-allowed' : undefined }}/>;
  };
  const numI = (key: string, def: number | string = '', w: number | string = 50) => (
    <input value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={{ ...niS, width: w, textAlign:'center' }}/>
  );
  const opinBox = (key: string, label: string = '라. 의견 및 판단근거', def: string = '') => (
    <div style={{ padding:'6px 10px', borderBottom:cb }}>
      <div style={{ fontSize:12, fontWeight:600, color:'#374151', marginBottom:4 }}>{label}</div>
      <textarea rows={4} value={String(f(key, def))} onChange={e => setF(key, e.target.value)} style={ntS}/>
    </div>
  );

  return (
    <div style={{ background:'#fff', border:'1px solid #d1d5db', borderRadius:4, overflow:'hidden' }}>

      {/* ═══ 1. 일반사항 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>1. 일반사항</div>
      <table style={ntbl}><colgroup><col style={{width:'8%'}}/><col style={{width:'42%'}}/><col style={{width:'12%'}}/><col style={{width:'38%'}}/></colgroup><tbody>
        <tr>
          <td style={nlS}>조사유형</td>
          <td colSpan={3} style={nvS}>
            {(['최초','정기','상태변화'] as const).map((v,i)=>(
              <label key={v} style={{ fontSize:12, marginRight:10 }}>
                <input type="radio" name="nd_surveyType" checked={String(f('nd_surveyType','정기'))===v} onChange={()=>{ setF('nd_surveyType',v); setF('nd_surveyEtc',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>{v}
              </label>
            ))}
            <label style={{ fontSize:12 }}>
              <input type="radio" name="nd_surveyType" checked={String(f('nd_surveyType','정기'))==='기타'} onChange={()=>setF('nd_surveyType','기타')} style={{marginRight:3,accentColor:'#16a34a'}}/>기타 (<input value={String(f('nd_surveyEtc',''))} onChange={e=>setF('nd_surveyEtc',e.target.value)} disabled={String(f('nd_surveyType','정기'))!=='기타'} style={{...niS,width:80,background:String(f('nd_surveyType','정기'))!=='기타'?'#f3f4f6':'#f9fbff',cursor:String(f('nd_surveyType','정기'))!=='기타'?'not-allowed':undefined}}/>)
            </label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>면담자</td>
          <td style={nvS}>
            <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'nowrap' }}>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...rad('nd_interviewee','수급자','수급자')}/>수급자</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...rad('nd_interviewee','보호자')}/>보호자</label>
              <span style={{ fontSize:12, whiteSpace:'nowrap' }}>성명</span>{nInp('nd_intervieweeName','',90)}
            </div>
          </td>
          <td style={nlS}>주수발자여부</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...rad('nd_mainCarer','Y')}/>Y</label>
            <label style={{ fontSize:12 }}><input {...rad('nd_mainCarer','N','N')}/>N</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>신장</td>
          <td style={nvS}>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {numI('nd_height','147',50)}<span style={{ fontSize:12, whiteSpace:'nowrap' }}>cm</span>
              <span style={{ fontSize:12, marginLeft:12, whiteSpace:'nowrap' }}>체중</span>
              {numI('nd_weight','47',50)}<span style={{ fontSize:12, whiteSpace:'nowrap' }}>kg</span>
            </div>
          </td>
          <td style={nlS}>BMI</td>
          <td style={nvS}>{numI('nd_bmi','21.8',60)}</td>
        </tr>
        <tr>
          <td style={nlS}>학력</td>
          <td colSpan={3} style={nvS}>
            {['무학·문맹','초등학교','중학교','고등학교','대학','대학원'].map(v=>(
              <label key={v} style={{ fontSize:12, marginRight:8 }}><input {...rad('nd_edu',v,'초등학교')}/>{v}</label>
            ))}
          </td>
        </tr>
      </tbody></table>

      {/* ═══ 2. 일반적 건강상태 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>2. 일반적 건강상태</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }} rowSpan={9}>가. 보유질환</td>
          <td style={{ ...nvS, width:'14%' }}><label style={{ fontSize:12 }}><input
            type="checkbox" checked={!!f('nd_d_noneAll',0)}
            onChange={e => {
              setF('nd_d_noneAll', e.target.checked ? 1 : 0);
              if (e.target.checked) DISEASE_KEYS.forEach(k => setF(k, ''));
              setIsDirty(true);
            }}
            style={{ marginRight:4, accentColor:'#16a34a' }}
          />없음</label></td>
          <td colSpan={2} style={nvS}/>
        </tr>
        <tr>
          <td style={nvS}>뇌신경계</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_stroke')}/>뇌졸중(뇌출혈,뇌경색증)</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_dementia')}/>치매</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_parkinson')}/>파킨슨병</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_depression')}/>우울증</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>호흡·순환기계</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_hypertension',1)}/>고혈압</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_angina')}/>협심증</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_heartAttack')}/>심근경색증</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_asthma')}/>천식</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_copd')}/>만성폐쇄성폐질환</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>내분비·대사</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_diabetes')}/>당뇨</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_hyperlipid',1)}/>고지혈증</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>근골격계</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_arthritis',1)}/>관절염(퇴행성 류마티스)</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_osteoporosis')}/>골다공증</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_fracture',1)}/>골절·탈골 등 사고로 인한 후유증</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>비뇨생식기계</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_renalFail')}/>만성신부전</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_uriInfect')}/>요로감염</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_bladder')}/>만성방광염</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_prostate')}/>전립선비대</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>감각계</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_cataract',1)}/>백내장</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_glaucoma')}/>녹내장</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_deaf')}/>난청</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_d_macular')}/>만성중이염</label>
            <label style={{ fontSize:12 }}><input {...dChk('nd_d_otherEye')}/>이명</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>감염</td>
          <td colSpan={2} style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_inf_tb')}/>결핵</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...dChk('nd_inf_scabies')}/>옴</label>
            <span style={{ fontSize:12 }}>다약제내성균(종류: </span>{dNInp('nd_inf_mrsa','',120)}<span style={{ fontSize:12 }}> )</span>
          </td>
        </tr>
        <tr>
          <td style={{ ...nvS, verticalAlign:'top' }}>기타 질환</td>
          <td colSpan={2} style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12 }}>암(진단명: </span>{dNInp('nd_cancer','2021년에 위장암 수술하심',200)}<span style={{ fontSize:12 }}> )</span>
            </div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12 }}>알레르기( </span>{dNInp('nd_allergy','',160)}<span style={{ fontSize:12 }}> ) × 식품·약물·접촉성 알레르기 등</span>
            </div>
            <div>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_otherDiseaseChk',0)} onChange={e=>{ setF('nd_otherDiseaseChk',e.target.checked?1:0); setF('nd_d_noneAll',0); if(!e.target.checked) setF('nd_otherDisease',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_otherDisease','허리 협착증'))} onChange={e=>{setF('nd_otherDisease',e.target.value);setF('nd_d_noneAll',0);setIsDirty(true);}} disabled={!f('nd_otherDiseaseChk',0)} style={{...niS,width:160,background:!f('nd_otherDiseaseChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_otherDiseaseChk',0)?'not-allowed':undefined}}/> )
              </label>
            </div>
          </td>
        </tr>
      </tbody></table>

      {/* 나. 복약 및 의료이용 */}
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }} rowSpan={5}>나. 복약 및<br/>의료이용</td>
          <td style={nvS}><label style={{ fontSize:12 }}><input
            type="checkbox" checked={!!f('nd_noMed',0)}
            onChange={e => {
              setF('nd_noMed', e.target.checked ? 1 : 0);
              if (e.target.checked) {
                // 나머지 복약 항목 모두 초기화
                ['nd_regMed','nd_medReason','nd_hospital','nd_medFreq',
                 'nd_irregMedChk','nd_irregMed',
                 'nd_sleepMed',
                 'nd_medEtcChk','nd_medEtc'].forEach(k => setF(k, ''));
              }
              setIsDirty(true);
            }}
            style={{ marginRight:4, accentColor:'#16a34a' }}
          />복용하는 약이 없음</label></td>
        </tr>
        <tr>
          <td style={nvS}>
            <label style={{ fontSize:12 }}>
              <input type="checkbox" checked={!!f('nd_regMed',0)} onChange={e=>{ setF('nd_regMed',e.target.checked?1:0); setF('nd_noMed',0); if(!e.target.checked){ setF('nd_medReason',''); setF('nd_hospital',''); setF('nd_medFreq',''); } setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>
              정기적 약 복용(사유: <input value={String(f('nd_medReason','고혈압, 고지혈증약'))} onChange={e=>{setF('nd_medReason',e.target.value);setF('nd_noMed',0);setIsDirty(true);}} disabled={!f('nd_regMed',0)} style={{...niS,width:140,background:!f('nd_regMed',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_regMed',0)?'not-allowed':undefined}}/>
              , 병원명: <input value={String(f('nd_hospital','나정일내과/빈센트병원'))} onChange={e=>{setF('nd_hospital',e.target.value);setF('nd_noMed',0);setIsDirty(true);}} disabled={!f('nd_regMed',0)} style={{...niS,width:140,background:!f('nd_regMed',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_regMed',0)?'not-allowed':undefined}}/>
              , 진료주기: 월 <input value={String(f('nd_medFreq','1'))} onChange={e=>{setF('nd_medFreq',e.target.value);setF('nd_noMed',0);setIsDirty(true);}} disabled={!f('nd_regMed',0)} style={{...niS,width:30,textAlign:'center',background:!f('nd_regMed',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_regMed',0)?'not-allowed':undefined}}/> 회)
            </label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>
            <label style={{ fontSize:12 }}>
              <input type="checkbox" checked={!!f('nd_irregMedChk',0)} onChange={e=>{ setF('nd_irregMedChk',e.target.checked?1:0); setF('nd_noMed',0); if(!e.target.checked) setF('nd_irregMed',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>
              비정기적 약 복용(사유: <input value={String(f('nd_irregMed','탁센(어깨통증약)'))} onChange={e=>{setF('nd_irregMed',e.target.value);setF('nd_noMed',0);setIsDirty(true);}} disabled={!f('nd_irregMedChk',0)} style={{...niS,width:200,background:!f('nd_irregMedChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_irregMedChk',0)?'not-allowed':undefined}}/> )
            </label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>
            <label style={{ fontSize:12 }}><input {...mChk('nd_sleepMed')}/>수면장애로 인한 약 복용</label>
          </td>
        </tr>
        <tr>
          <td style={nvS}>
            <label style={{ fontSize:12 }}>
              <input type="checkbox" checked={!!f('nd_medEtcChk',0)} onChange={e=>{ setF('nd_medEtcChk',e.target.checked?1:0); setF('nd_noMed',0); if(!e.target.checked) setF('nd_medEtc',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_medEtc',''))} onChange={e=>{setF('nd_medEtc',e.target.value);setF('nd_noMed',0);setIsDirty(true);}} disabled={!f('nd_medEtcChk',0)} style={{...niS,width:200,background:!f('nd_medEtcChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_medEtcChk',0)?'not-allowed':undefined}}/> )
            </label>
          </td>
        </tr>
      </tbody></table>

      {/* 다. 구강과 영양상태 */}
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%' }} rowSpan={4}>다. 구강과<br/>영양상태</td>
          <td style={{ ...nlS, width:'12%' }}>1) 구강상태</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input type="checkbox" checked={!!f('nd_oral_good',0)}
              onChange={e=>{ setF('nd_oral_good',e.target.checked?1:0); if(e.target.checked){['nd_oral_denture','nd_oral_partial','nd_oral_full','nd_oral_noDent','nd_oral_etcChk','nd_oral_etc'].forEach(k=>setF(k,''));} setIsDirty(true); }}
              style={{marginRight:4,accentColor:'#16a34a'}}/>양호</label>
            {(() => {
              const oChk = (key: string, def: number = 0) => ({ type:'checkbox' as const, checked:!!f(key,def), onChange:(e:React.ChangeEvent<HTMLInputElement>)=>{setF(key,e.target.checked?1:0);setF('nd_oral_good',0);setIsDirty(true);}, style:{marginRight:4,accentColor:'#16a34a'} as React.CSSProperties });
              const oInp = (key: string, def: string='', w?: number|string) => <input value={String(f(key,def))} onChange={e=>{setF(key,e.target.value);setF('nd_oral_good',0);setIsDirty(true);}} style={{...niS,width:w??'100%'}}/>;
              void oInp; // suppress unused warning
              return (<>
                <label style={{ fontSize:12, marginRight:4 }}>
                  <input type="checkbox" checked={!!f('nd_oral_denture',0)} onChange={e=>{ setF('nd_oral_denture',e.target.checked?1:0); setF('nd_oral_good',0); if(!e.target.checked){ setF('nd_oral_partial',0); setF('nd_oral_full',0); } setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>틀니착용
                </label>
                <span style={{ fontSize:12 }}>( </span>
                <label style={{ fontSize:12, marginRight:4 }}>
                  <input type="radio" name="nd_oral_denture_type" checked={!!f('nd_oral_partial',0)} onChange={()=>{ setF('nd_oral_partial',1); setF('nd_oral_full',0); setF('nd_oral_denture',1); setF('nd_oral_good',0); setIsDirty(true); }} disabled={!f('nd_oral_denture',0)} style={{marginRight:3,accentColor:'#16a34a',cursor:!f('nd_oral_denture',0)?'not-allowed':undefined}}/>부분
                </label>
                <label style={{ fontSize:12, marginRight:4 }}>
                  <input type="radio" name="nd_oral_denture_type" checked={!!f('nd_oral_full',0)} onChange={()=>{ setF('nd_oral_full',1); setF('nd_oral_partial',0); setF('nd_oral_denture',1); setF('nd_oral_good',0); setIsDirty(true); }} disabled={!f('nd_oral_denture',0)} style={{marginRight:3,accentColor:'#16a34a',cursor:!f('nd_oral_denture',0)?'not-allowed':undefined}}/>완전
                </label>
                <span style={{ fontSize:12 }}>)</span>
                <label style={{ fontSize:12, marginLeft:8, marginRight:6 }}><input {...oChk('nd_oral_noDent')}/>잔존치아 없음</label>
                <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_oral_etcChk',0)} onChange={e=>{ setF('nd_oral_etcChk',e.target.checked?1:0); setF('nd_oral_good',0); if(!e.target.checked) setF('nd_oral_etc',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_oral_etc',''))} onChange={e=>{setF('nd_oral_etc',e.target.value);setF('nd_oral_good',0);setIsDirty(true);}} disabled={!f('nd_oral_etcChk',0)} style={{...niS,width:100,background:!f('nd_oral_etcChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_oral_etcChk',0)?'not-allowed':undefined}}/> )</label>
              </>);
            })()}
          </td>
        </tr>
        <tr>
          <td style={nlS}>2) 구강건강</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input type="checkbox" checked={!!f('nd_oralH_good',1)}
              onChange={e=>{ setF('nd_oralH_good',e.target.checked?1:0); if(e.target.checked){['nd_oralH_bad','nd_oralH_bleed','nd_oralH_dry','nd_oralH_etcChk','nd_oralH_etc'].forEach(k=>setF(k,''));} setIsDirty(true); }}
              style={{marginRight:4,accentColor:'#16a34a'}}/>양호</label>
            {(() => {
              const hChk = (key: string, def: number = 0) => ({ type:'checkbox' as const, checked:!!f(key,def), onChange:(e:React.ChangeEvent<HTMLInputElement>)=>{setF(key,e.target.checked?1:0);setF('nd_oralH_good',0);setIsDirty(true);}, style:{marginRight:4,accentColor:'#16a34a'} as React.CSSProperties });
              const hInp = (key: string, def: string='', w?: number|string) => <input value={String(f(key,def))} onChange={e=>{setF(key,e.target.value);setF('nd_oralH_good',0);setIsDirty(true);}} style={{...niS,width:w??'100%'}}/>;
              void hInp; // suppress unused warning
              return (<>
                <label style={{ fontSize:12, marginRight:6 }}><input {...hChk('nd_oralH_bad')}/>구취/위생불량</label>
                <label style={{ fontSize:12, marginRight:6 }}><input {...hChk('nd_oralH_bleed')}/>잇몸출혈/통증</label>
                <label style={{ fontSize:12, marginRight:6 }}><input {...hChk('nd_oralH_dry')}/>구강건조</label>
                <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_oralH_etcChk',0)} onChange={e=>{ setF('nd_oralH_etcChk',e.target.checked?1:0); setF('nd_oralH_good',0); if(!e.target.checked) setF('nd_oralH_etc',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_oralH_etc',''))} onChange={e=>{setF('nd_oralH_etc',e.target.value);setF('nd_oralH_good',0);setIsDirty(true);}} disabled={!f('nd_oralH_etcChk',0)} style={{...niS,width:100,background:!f('nd_oralH_etcChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_oralH_etcChk',0)?'not-allowed':undefined}}/> )</label>
              </>);
            })()}
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>3) 식사형태</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:4 }}>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_meal_normal',1)}/>일반식</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_meal_multi')}/>다건식</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_meal_porridge')}/>죽</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_meal_liquid')}/>유동식</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_meal_tube')}/>경관영양</label>
              <label style={{ fontSize:12 }}><input {...etcChk('nd_meal_etcChk','nd_meal_etc')}/>기타( {etcInp('nd_meal_etcChk','nd_meal_etc','',80)} )</label>
            </div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12 }}>치료식 ≫ </span>
              <label style={{ fontSize:12, marginRight:6 }}><input type="checkbox" checked={!!f('nd_meal_txNone',1)}
                onChange={e=>{ setF('nd_meal_txNone',e.target.checked?1:0); if(e.target.checked){['nd_meal_diabetic','nd_meal_lowSalt','nd_meal_txEtcChk','nd_meal_txEtc'].forEach(k=>setF(k,'')); } setIsDirty(true); }}
                style={{marginRight:4,accentColor:'#16a34a'}}/>해당없음</label>
              {(() => {
                const txChk = (key: string) => ({ type:'checkbox' as const, checked:!!f(key,0), onChange:(e:React.ChangeEvent<HTMLInputElement>)=>{setF(key,e.target.checked?1:0);setF('nd_meal_txNone',0);setIsDirty(true);}, style:{marginRight:4,accentColor:'#16a34a'} as React.CSSProperties });
                const txInp = (key: string, def='', w?: number|string) => <input value={String(f(key,def))} onChange={e=>{setF(key,e.target.value);setF('nd_meal_txNone',0);setIsDirty(true);}} style={{...niS,width:w??'100%'}}/>;
                return (<>
                  <label style={{ fontSize:12, marginRight:6 }}><input {...txChk('nd_meal_diabetic')}/>당뇨식</label>
                  <label style={{ fontSize:12, marginRight:6 }}><input {...txChk('nd_meal_lowSalt')}/>저염식</label>
                  <label style={{ fontSize:12 }}>
                    <input type="checkbox" checked={!!f('nd_meal_txEtcChk',0)} onChange={e=>{ setF('nd_meal_txEtcChk',e.target.checked?1:0); setF('nd_meal_txNone',0); if(!e.target.checked) setF('nd_meal_txEtc',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_meal_txEtc',''))} onChange={e=>{setF('nd_meal_txEtc',e.target.value);setF('nd_meal_txNone',0);setIsDirty(true);}} disabled={!f('nd_meal_txEtcChk',0)} style={{...niS,width:80,background:!f('nd_meal_txEtcChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_meal_txEtcChk',0)?'not-allowed':undefined}}/> )
                  </label>
                </>);
              })()}
            </div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12 }}>기피식품 ≫ </span>
              <label style={{ fontSize:12, marginRight:6 }}><input type="radio" name="nd_meal_avoid" checked={String(f('nd_meal_avoid','none'))==='none'} onChange={()=>{ setF('nd_meal_avoid','none'); setF('nd_meal_avoidDetail',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>없음</label>
              <label style={{ fontSize:12, marginRight:6 }}><input type="radio" name="nd_meal_avoid" checked={String(f('nd_meal_avoid','none'))==='yes'} onChange={()=>setF('nd_meal_avoid','yes')} style={{marginRight:3,accentColor:'#16a34a'}}/>있음</label>
              <input value={String(f('nd_meal_avoidDetail','유제품(특히 치즈)'))} onChange={e=>{ setF('nd_meal_avoidDetail',e.target.value); if(e.target.value) setF('nd_meal_avoid','yes'); }} disabled={String(f('nd_meal_avoid','none'))!=='yes'} style={{...niS,width:160,background:String(f('nd_meal_avoid','none'))!=='yes'?'#f3f4f6':'#f9fbff',cursor:String(f('nd_meal_avoid','none'))!=='yes'?'not-allowed':undefined}}/>
            </div>
            <div>
              <span style={{ fontSize:12 }}>식사제공 유의사항( </span>
              <textarea
                maxLength={200}
                rows={2}
                value={String(f('nd_meal_note','부드럽고 소화가 잘되는 음식을 제공할 수 있도록 한다.'))}
                onChange={e=>setF('nd_meal_note',e.target.value)}
                style={{ ...ntS, width:'80%', verticalAlign:'middle' }}
              />
              <span style={{ fontSize:12 }}> )</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>4) 영양상태</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input
              type="radio" name="nd_nutrition" checked={String(f('nd_nutrition','양호'))==='양호'}
              onChange={() => { setF('nd_nutrition','양호'); ['nd_nutr_anorexia','nd_nutr_weightLoss','nd_nutr_overweight','nd_nutr_etcChk','nd_nutr_etc'].forEach(k=>setF(k,'')); setIsDirty(true); }}
              style={{marginRight:3,accentColor:'#16a34a'}}/>양호</label>
            <label style={{ fontSize:12, marginRight:4 }}><input {...rad('nd_nutrition','불량')}/>불량</label>
            <span style={{ fontSize:12 }}>( </span>
            {(() => {
              const nChk = (key: string) => ({ type:'checkbox' as const, checked:!!f(key,0), onChange:(e:React.ChangeEvent<HTMLInputElement>)=>{setF(key,e.target.checked?1:0);setF('nd_nutrition','불량');setIsDirty(true);}, style:{marginRight:4,accentColor:'#16a34a'} as React.CSSProperties });
              const nInpN = (key: string, def='', w?: number|string) => <input value={String(f(key,def))} onChange={e=>{setF(key,e.target.value);setF('nd_nutrition','불량');setIsDirty(true);}} style={{...niS,width:w??'100%'}}/>;
              void nInpN; // suppress unused warning
              return (<>
                <label style={{ fontSize:12, marginRight:4 }}><input {...nChk('nd_nutr_anorexia')}/>식욕부진</label>
                <label style={{ fontSize:12, marginRight:4 }}><input {...nChk('nd_nutr_weightLoss')}/>체중감소</label>
                <label style={{ fontSize:12, marginRight:4 }}><input {...nChk('nd_nutr_overweight')}/>체중과다</label>
                <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_nutr_etcChk',0)} onChange={e=>{ setF('nd_nutr_etcChk',e.target.checked?1:0); setF('nd_nutrition','불량'); if(!e.target.checked) setF('nd_nutr_etc',''); setIsDirty(true); }} style={{marginRight:4,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_nutr_etc',''))} onChange={e=>{setF('nd_nutr_etc',e.target.value);setF('nd_nutrition','불량');setIsDirty(true);}} disabled={!f('nd_nutr_etcChk',0)} style={{...niS,width:80,background:!f('nd_nutr_etcChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_nutr_etcChk',0)?'not-allowed':undefined}}/> )</label>
              </>);
            })()}
            <span style={{ fontSize:12 }}> )</span>
          </td>
        </tr>
      </tbody></table>
      {opinBox('nd_opinion2', '라. 의견 및 판단근거', '- 고혈압, 고지혈증 등 만성질환과 퇴행성 관절염, 위암 수술 이력(2021년)이 있음. 특히 수차례의 골절(무릎, 팔꿈치) 및 고관절 수술로 인해 허리가 굽고 지체장애 5등급 판정을 받은 상태로 거동이 매우 불안정하심.\n- 부분 틀니를 착용 중이나 전반적인 구강 위생 및 건강 상태는 양호함. 유제품(치즈 등)에 대한 기피가 있어 식단 구성 시 이를 고려해야 함.')}

      {/* ═══ 3. 일상생활기능 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'6px 10px', borderBottom:cb }}>3. 일상생활기능</div>
      <div style={{ padding:'3px 10px', borderBottom:cb, fontSize:10, color:'#64748b', background:'#f8fafc' }}>
        [ <b>0</b>: 혼자 할 수 있음 &nbsp;·&nbsp; <b>1</b>: 지시(준비)도움 &nbsp;·&nbsp; <b>2</b>: 직접(부축)도움 &nbsp;·&nbsp; <b>3</b>: 전혀 수행할 수 없음 ]
      </div>
      {(() => {
        // 0~3 클릭 버튼 입력 컴포넌트
        const adlBtn = (key: string, def: string | number) => {
          const cur = String(f(key, def));
          return (
            <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
              {['0','1','2','3'].map(v => (
                <button key={v} type="button" onClick={() => { setF(key, v); setIsDirty(true); }}
                  style={{ width:22, height:22, borderRadius:3, border:`1px solid ${cur===v?'#2563eb':'#d1d5db'}`,
                    background: cur===v ? '#2563eb' : '#f9fbff',
                    color: cur===v ? '#fff' : '#475569',
                    fontSize:12, fontWeight:700, cursor:'pointer', padding:0, lineHeight:1 }}>
                  {v}
                </button>
              ))}
            </div>
          );
        };
        const cS: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'3px 6px', borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
        const hS: React.CSSProperties = { ...cS, background:hBg, fontWeight:600, textAlign:'center' };
        const vC: React.CSSProperties = { ...cS, textAlign:'center', width:'11%' };
        return (
          <table style={ntbl}>
            <colgroup>
              <col style={{ width:'16%' }}/><col/><col style={{ width:'11%' }}/>
              <col style={{ width:'2%' }}/><col/><col style={{ width:'11%' }}/>
            </colgroup>
            <thead><tr>
              <td style={{ ...hS }}/>
              <td style={{ ...hS }}>구분</td>
              <td style={{ ...hS }}>확인</td>
              <td style={{ ...hS }}/>
              <td style={{ ...hS }}>구분</td>
              <td style={{ ...hS }}>확인</td>
            </tr></thead>
            <tbody>
              <tr>
                <td style={{ ...hS, verticalAlign:'middle', textAlign:'left', paddingLeft:8 }} rowSpan={2}>가. 위생관리</td>
                <td style={cS}>1) 세수하기</td>
                <td style={vC}>{adlBtn('nd_adl_wash','0')}</td>
                <td style={cS}>3)</td>
                <td style={cS}>화장실(이동변기) 사용하기</td>
                <td style={vC}>{adlBtn('nd_adl_toilet','1')}</td>
              </tr>
              <tr>
                <td style={cS}>2) 양치질하기(틀니관리)</td>
                <td style={vC}>{adlBtn('nd_adl_brush','0')}</td>
                <td style={cS}>4)</td>
                <td style={cS}>몸 씻기</td>
                <td style={vC}>{adlBtn('nd_adl_bath','2')}</td>
              </tr>
              <tr>
                <td style={{ ...hS, verticalAlign:'middle', textAlign:'left', paddingLeft:8 }} rowSpan={2}>나. 일상생활</td>
                <td style={cS}>1) 옷 벗고 입기</td>
                <td style={vC}>{adlBtn('nd_adl_dress','1')}</td>
                <td style={cS}>3)</td>
                <td style={cS}>음식 삼키기</td>
                <td style={vC}>{adlBtn('nd_adl_swallow','0')}</td>
              </tr>
              <tr>
                <td style={cS}>2) 식사하기</td>
                <td style={vC}>{adlBtn('nd_adl_eat','1')}</td>
                <td colSpan={3} style={cS}/>
              </tr>
              <tr>
                <td style={{ ...hS, verticalAlign:'middle', textAlign:'left', paddingLeft:8 }} rowSpan={3}>다. 도구적<br/>일상생활</td>
                <td style={cS}>1) 청소 및 정리정돈</td>
                <td style={vC}>{adlBtn('nd_iadl_clean','3')}</td>
                <td style={cS}>4)</td>
                <td style={cS}>교통수단 이용하기</td>
                <td style={vC}>{adlBtn('nd_iadl_transport','3')}</td>
              </tr>
              <tr>
                <td style={cS}>2) 식사 준비하기</td>
                <td style={vC}>{adlBtn('nd_iadl_cook','3')}</td>
                <td style={cS}>5)</td>
                <td style={cS}>약 챙겨먹기</td>
                <td style={vC}>{adlBtn('nd_iadl_med','1')}</td>
              </tr>
              <tr>
                <td style={cS}>3) 빨래하기</td>
                <td style={vC}>{adlBtn('nd_iadl_laundry','3')}</td>
                <td style={cS}>6)</td>
                <td style={cS}>물건사기</td>
                <td style={vC}>{adlBtn('nd_iadl_shop','3')}</td>
              </tr>
            </tbody>
          </table>
        );
      })()}

      {/* 라. 배뇨기능 및 방법 */}
      <table style={ntbl}><colgroup><col style={{width:'16%'}}/><col style={{width:'14%'}}/><col/></colgroup><tbody>
        <tr>
          <td style={{ ...nlS, verticalAlign:'middle' }} rowSpan={2}>라. 배뇨기능<br/>및 방법</td>
          <td style={{ ...nlS, fontWeight:500 }}>1) 배뇨기능</td>
          <td style={{ ...nvS, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
            <label style={{ fontSize:12 }}><input {...jtNoneChk('nd_uri_good',['nd_uri_incon','nd_uri_diff','nd_uri_noFeel','nd_uri_etcChk'],['nd_uri_etc'])}/>양호</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_uri_incon','nd_uri_good',1)}/>요실금</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_uri_diff','nd_uri_good')}/>배뇨곤란(배뇨 시 통증, 배뇨지연 등)</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_uri_noFeel','nd_uri_good')}/>요의 느끼지 못함</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_uri_etcChk','nd_uri_etc','nd_uri_good')}/>기타( {nrsEtcInp('nd_uri_etcChk','nd_uri_etc','nd_uri_good','',100)} )</label>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, fontWeight:500 }}>2) 배뇨방법</td>
          <td style={{ ...nvS, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
            <label style={{ fontSize:12 }}><input {...chk('nd_uri_mToilet',1)}/>화장실</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_uri_mPortable')}/>이동변기</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_uri_mDiaper')}/>기저귀</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_uri_mCath')}/>배뇨관(유치도뇨관·방광루 등)</label>
            <label style={{ fontSize:12 }}><input {...etcChk('nd_uri_mEtcChk','nd_uri_mEtc')}/>기타( {etcInp('nd_uri_mEtcChk','nd_uri_mEtc','',100)} )</label>
          </td>
        </tr>
      </tbody></table>

      {/* 마. 배변기능 및 방법 */}
      <table style={ntbl}><colgroup><col style={{width:'16%'}}/><col style={{width:'14%'}}/><col/></colgroup><tbody>
        <tr>
          <td style={{ ...nlS, verticalAlign:'middle' }} rowSpan={2}>마. 배변기능<br/>및 방법</td>
          <td style={{ ...nlS, fontWeight:500 }}>1) 배변기능</td>
          <td style={{ ...nvS, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
            <label style={{ fontSize:12 }}><input {...jtNoneChk('nd_bow_good',['nd_bow_incon','nd_bow_diarrhea','nd_bow_constip','nd_bow_noFeel','nd_bow_etcChk'],['nd_bow_etc'],1)}/>양호</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_bow_incon','nd_bow_good')}/>변실금</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_bow_diarrhea','nd_bow_good')}/>잦은 설사</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_bow_constip','nd_bow_good')}/>변비</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_bow_noFeel','nd_bow_good')}/>변의 느끼지 못함</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_bow_etcChk','nd_bow_etc','nd_bow_good')}/>기타( {nrsEtcInp('nd_bow_etcChk','nd_bow_etc','nd_bow_good','',100)} )</label>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, fontWeight:500 }}>2) 배변방법</td>
          <td style={{ ...nvS, display:'flex', flexWrap:'wrap', gap:4, alignItems:'center' }}>
            <label style={{ fontSize:12 }}><input {...chk('nd_bow_mToilet',1)}/>화장실</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_bow_mPortable')}/>이동변기</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_bow_mDiaper')}/>기저귀</label>
            <label style={{ fontSize:12 }}><input {...chk('nd_bow_mStoma')}/>장루</label>
            <label style={{ fontSize:12 }}><input {...etcChk('nd_bow_mEtcChk','nd_bow_mEtc')}/>기타( {etcInp('nd_bow_mEtcChk','nd_bow_mEtc','',100)} )</label>
          </td>
        </tr>
      </tbody></table>
      {opinBox('nd_opinion3', '바. 의견 및 판단근거', '- 상지 기능이 비교적 자유로워 스스로 할 수 있는 부분은 최대한 자립을 유도하여 잔존 능력을 유지하되, 허리 협착증으로 인한 거동 불안정을 고려하여 낙상 위험이 있는 화장실 및 목욕 시에는 밀착 보조를 실시할 수 있도록 함.\n- 지체장애 5등급 및 보행 장애로 인해 가사 분야와 외부 활동에 제약이 크므로, 수급자의 주거 환경 정결과 영양 관리를 위한 대행 서비스를 집중 제공함. 특히 복용 약물이 많으므로 약 정기 먹기에 대한 정확한 투약 보조를 병행함.')}

      {/* ═══ 4. 재활 및 신체기능 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>4. 재활 및 신체기능</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }} rowSpan={4}>가. 근골격계<br/>증상</td>
          <td style={{ ...nlS, width:'12%' }}>1) 관절구축</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...jtNoneChk('nd_jt_con_none',['nd_jt_con_uL','nd_jt_con_uR','nd_jt_con_lL','nd_jt_con_lR'],'nd_jt_con_part',1)}/>없음</label>
            <span style={{ fontSize:12 }}>상지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_con_uL','nd_jt_con_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_con_uR','nd_jt_con_none')}/>우</label>
            <span style={{ fontSize:12 }}>) 하지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_con_lL','nd_jt_con_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_con_lR','nd_jt_con_none')}/>우</label>
            <span style={{ fontSize:12 }}>) 부위( </span>{jtPartInp('nd_jt_con_part','nd_jt_con_none','',80)}<span style={{ fontSize:12 }}> )</span>
          </td>
        </tr>
        <tr>
          <td style={nlS}>2) 운동장애</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...jtNoneChk('nd_jt_mov_none',['nd_jt_mov_uL','nd_jt_mov_uR','nd_jt_mov_lL','nd_jt_mov_lR'],'nd_jt_mov_part')}/>없음</label>
            <span style={{ fontSize:12 }}>상지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_mov_uL','nd_jt_mov_none',1)}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_mov_uR','nd_jt_mov_none',1)}/>우</label>
            <span style={{ fontSize:12 }}>) 하지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_mov_lL','nd_jt_mov_none',1)}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_mov_lR','nd_jt_mov_none',1)}/>우</label>
            <span style={{ fontSize:12 }}>) 부위( </span>{jtPartInp('nd_jt_mov_part','nd_jt_mov_none','팔꿈치, 무릎, 고관절',100)}<span style={{ fontSize:12 }}> )</span>
          </td>
        </tr>
        <tr>
          <td style={nlS}>3) 마비</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...jtNoneChk('nd_jt_para_none',['nd_jt_para_uL','nd_jt_para_uR','nd_jt_para_lL','nd_jt_para_lR'],'nd_jt_para_part',1)}/>없음</label>
            <span style={{ fontSize:12 }}>상지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_para_uL','nd_jt_para_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_para_uR','nd_jt_para_none')}/>우</label>
            <span style={{ fontSize:12 }}>) 하지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_para_lL','nd_jt_para_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_para_lR','nd_jt_para_none')}/>우</label>
            <span style={{ fontSize:12 }}>) 부위( </span>{jtPartInp('nd_jt_para_part','nd_jt_para_none','',80)}<span style={{ fontSize:12 }}> )</span>
          </td>
        </tr>
        <tr>
          <td style={nlS}>4) 절단</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...jtNoneChk('nd_jt_amp_none',['nd_jt_amp_uL','nd_jt_amp_uR','nd_jt_amp_lL','nd_jt_amp_lR'],undefined,1)}/>없음</label>
            <span style={{ fontSize:12 }}>상지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_amp_uL','nd_jt_amp_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_amp_uR','nd_jt_amp_none')}/>우</label>
            <span style={{ fontSize:12 }}>) 하지 (</span>
            <label style={{ fontSize:12, marginRight:2 }}><input {...jtSubChk('nd_jt_amp_lL','nd_jt_amp_none')}/>좌</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_jt_amp_lR','nd_jt_amp_none')}/>우</label>
            <span style={{ fontSize:12 }}>)</span>
          </td>
        </tr>
      </tbody></table>

      {/* 나. 보행상태 */}
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }}>나. 보행상태</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:3 }}>
              <label style={{ fontSize:12, marginRight:8 }}><input {...rad('nd_walk_type','self')}/>자립보행 가능</label>
              <label style={{ fontSize:12 }}><input {...rad('nd_walk_type','device','device')}/>보장구를 사용하여 자립보행 가능</label>
            </div>
            <div style={{ marginBottom:3 }}>
              <label style={{ fontSize:12, marginRight:8 }}><input {...rad('nd_walk_type','assist')}/>부축해주면 보행 가능</label>
              <label style={{ fontSize:12, marginRight:8 }}><input {...rad('nd_walk_type','assistDev')}/>보장구를 사용하여 부축을 받아 보행 가능</label>
              <label style={{ fontSize:12 }}><input {...rad('nd_walk_type','unable')}/>보행 불가</label>
            </div>
            <div>
              <span style={{ fontSize:12 }}>보장구 종류 ≫ </span>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_walk_cane')}/>지팡이</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_walk_walker',1)}/>성인용 보행기</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_walk_wheelchair')}/>휠체어</label>
              <label style={{ fontSize:12 }}><input {...etcChk('nd_walk_etcChk','nd_walk_etc')}/>기타( {etcInp('nd_walk_etcChk','nd_walk_etc','',80)} )</label>
            </div>
          </td>
        </tr>
      </tbody></table>

      {/* 다. 낙상 */}
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%' }}>다. 지난 3개월간 낙상</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input type="radio" name="nd_fall" checked={String(f('nd_fall','none'))==='none'} onChange={()=>{ setF('nd_fall','none'); setF('nd_fall_cnt',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>없음</label>
            <label style={{ fontSize:12 }}><input type="radio" name="nd_fall" checked={String(f('nd_fall','none'))==='yes'} onChange={()=>setF('nd_fall','yes')} style={{marginRight:3,accentColor:'#16a34a'}}/>있음(횟수: <input value={String(f('nd_fall_cnt',''))} onChange={e=>{ setF('nd_fall_cnt',e.target.value); if(e.target.value) setF('nd_fall','yes'); }} style={{...niS,width:40,textAlign:'center'}}/> )</label>
          </td>
        </tr>
      </tbody></table>

      {/* 라. 신체기능 — 다.와 구분선으로 분리 + 안내문구 */}
      <div style={{ marginTop:8, padding:'4px 10px', borderTop:`2px solid ${cb}`, borderBottom:cb, fontSize:11, color:'#64748b', background:'#f8fafc', textAlign:'right' }}>
        [ 0: 혼자 할 수 있음, 1: 지시(준비)도움, 2: 직접(부축)도움, 3: 전혀 수행할 수 없음 ]
      </div>
      {(() => {
        const adlBtn2 = (key: string, def: string | number) => {
          const cur = String(f(key, def));
          return (
            <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
              {['0','1','2','3'].map(v => (
                <button key={v} type="button" onClick={() => { setF(key, v); setIsDirty(true); }}
                  style={{ width:22, height:22, borderRadius:3, border:`1px solid ${cur===v?'#2563eb':'#d1d5db'}`,
                    background: cur===v ? '#2563eb' : '#f9fbff',
                    color: cur===v ? '#fff' : '#475569',
                    fontSize:12, fontWeight:700, cursor:'pointer', padding:0, lineHeight:1 }}>
                  {v}
                </button>
              ))}
            </div>
          );
        };
        const cS2: React.CSSProperties = { fontSize:12, color:'#1e293b', padding:'3px 6px', borderRight:cb, borderBottom:cb, verticalAlign:'middle' };
        const hS2: React.CSSProperties = { ...cS2, background:hBg, fontWeight:600, textAlign:'center' };
        const vC2: React.CSSProperties = { ...cS2, textAlign:'center', width:'11%' };
        return (
          <table style={ntbl}>
            <colgroup>
              <col style={{ width:'16%' }}/><col/><col style={{ width:'11%' }}/><col style={{ width:'2%' }}/><col/><col style={{ width:'11%' }}/>
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...hS2, verticalAlign:'middle', textAlign:'left', paddingLeft:8 }} rowSpan={2}>라. 신체기능</td>
                <td style={cS2}>1) 누운 상태에서 옆으로 돌아눕기</td>
                <td style={vC2}>{adlBtn2('nd_phys_turn','0')}</td>
                <td style={cS2}>3)</td>
                <td style={cS2}>바닥에 앉은 상태에서 일어서기</td>
                <td style={vC2}>{adlBtn2('nd_phys_standup','1')}</td>
              </tr>
              <tr>
                <td style={cS2}>2) 누운 상태에서 몸 일으켜 앉기</td>
                <td style={vC2}>{adlBtn2('nd_phys_situp','0')}</td>
                <td style={cS2}>4)</td>
                <td style={cS2}>실내 보행하기</td>
                <td style={vC2}>{adlBtn2('nd_phys_indoorWalk','1')}</td>
              </tr>
            </tbody>
          </table>
        );
      })()}
      {opinBox('nd_opinion4', '마. 의견 및 판단근거', '- 퇴행성 관절염으로 인해 무릎 인공관절 수술 및 고관절 수술을 받았으며, 낙상으로 인한 양쪽 팔꿈치 수술 이력이 있으심. 이로 인해 상하지 모든 관절 부위에 약간의 구축 및 운동 장애가 관찰되며, 특히 허리가 굽아 신체 전반의 균형 감각이 저하된 상태임.\n- 자립하여 이동하실 수 없으며 보행보조차를 사용해야만 근거리 보행이 가능한 상태이심. 보행 시 상체가 앞으로 굽어 있어 낙상 위험이 높음.')}

      {/* ═══ 5. 간호관리 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>5. 간호관리</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%' }}>가. 호흡기간호</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_resp_none',['nd_nrs_resp_trach','nd_nrs_resp_suction','nd_nrs_resp_o2','nd_nrs_resp_neb','nd_nrs_resp_etcChk'],['nd_nrs_resp_etc'],1)}/>없음</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_resp_trach','nd_nrs_resp_none')}/>기관절개관</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_resp_suction','nd_nrs_resp_none')}/>흡인</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_resp_o2','nd_nrs_resp_none')}/>산소요법</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_resp_neb','nd_nrs_resp_none')}/>분무요법(네뷸라이저)</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_resp_etcChk','nd_nrs_resp_etc','nd_nrs_resp_none')}/>기타( {nrsEtcInp('nd_nrs_resp_etcChk','nd_nrs_resp_etc','nd_nrs_resp_none','',120)} )</label>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>나. 피부간호</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:2 }}>
              <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_skin_none',['nd_nrs_skin_ulcerChk','nd_nrs_skin_neuro','nd_nrs_skin_wound','nd_nrs_skin_burn','nd_nrs_skin_etcChk'],['nd_nrs_skin_part','nd_nrs_skin_stage','nd_nrs_skin_etc'],1)}/>없음</label>
            </div>
            <div style={{ marginBottom:2, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_nrs_skin_ulcerChk',0)} onChange={e=>{ setF('nd_nrs_skin_ulcerChk',e.target.checked?1:0); setF('nd_nrs_skin_none',0); if(!e.target.checked){ setF('nd_nrs_skin_part',''); setF('nd_nrs_skin_stage',''); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>욕창
              </label>
              <span style={{ fontSize:12 }}>(부위: <input value={String(f('nd_nrs_skin_part',''))} onChange={e=>{ setF('nd_nrs_skin_part',e.target.value); setF('nd_nrs_skin_none',0); }} disabled={!f('nd_nrs_skin_ulcerChk',0)} style={{...niS,width:100,background:!f('nd_nrs_skin_ulcerChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_nrs_skin_ulcerChk',0)?'not-allowed':undefined}}/></span>
              <span style={{ fontSize:12 }}>단계:</span>
              {['1','2','3','4'].map(v => (
                <label key={v} style={{ fontSize:12 }}>
                  <input type="radio" name="nd_nrs_skin_stage" checked={String(f('nd_nrs_skin_stage',''))===v} onChange={()=>{ setF('nd_nrs_skin_stage',v); setF('nd_nrs_skin_none',0); }} disabled={!f('nd_nrs_skin_ulcerChk',0)} style={{marginRight:3,accentColor:'#16a34a',cursor:!f('nd_nrs_skin_ulcerChk',0)?'not-allowed':undefined}}/>{v}단계
                </label>
              ))}
              <span style={{ fontSize:12 }}>)</span>
            </div>
            <div style={{ marginBottom:2 }}>
              <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_skin_neuro','nd_nrs_skin_none')}/>말초신경병증궤양(당뇨발 등)</label>
              <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_skin_wound','nd_nrs_skin_none')}/>흡인</label>
              <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_skin_burn','nd_nrs_skin_none')}/>화상</label>
              <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_skin_etcChk','nd_nrs_skin_etc','nd_nrs_skin_none')}/>기타( {nrsEtcInp('nd_nrs_skin_etcChk','nd_nrs_skin_etc','nd_nrs_skin_none','',120)} )</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>다. 소화기간호</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_gi_none',['nd_nrs_gi_ngt','nd_nrs_gi_gastro','nd_nrs_gi_etcChk'],['nd_nrs_gi_etc'],1)}/>없음</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_gi_ngt','nd_nrs_gi_none')}/>비위관</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_gi_gastro','nd_nrs_gi_none')}/>위관</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_gi_etcChk','nd_nrs_gi_etc','nd_nrs_gi_none')}/>기타( {nrsEtcInp('nd_nrs_gi_etcChk','nd_nrs_gi_etc','nd_nrs_gi_none','',120)} )</label>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>라. 통증간호</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_pain_none',['nd_nrs_pain_genChk','nd_nrs_pain_cancerChk','nd_nrs_pain_daily','nd_nrs_pain_weekly','nd_nrs_pain_oral','nd_nrs_pain_narcOral','nd_nrs_pain_narcInj','nd_nrs_pain_patch','nd_nrs_pain_visit','nd_nrs_pain_etcChk'],['nd_nrs_pain_part','nd_nrs_pain_score','nd_nrs_pain_cancerPart','nd_nrs_pain_cancerScore','nd_nrs_pain_etc'])}/>없음</label>
            <div style={{ marginTop:2, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_nrs_pain_genChk',0)} onChange={e=>{ setF('nd_nrs_pain_genChk',e.target.checked?1:0); setF('nd_nrs_pain_none',0); if(!e.target.checked){ setF('nd_nrs_pain_part',''); setF('nd_nrs_pain_score',''); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>일반통증
              </label>
              <span style={{ fontSize:12 }}>(부위: <input value={String(f('nd_nrs_pain_part','허리, 어깨'))} onChange={e=>{ setF('nd_nrs_pain_part',e.target.value); setF('nd_nrs_pain_none',0); }} disabled={!f('nd_nrs_pain_genChk',0)} style={{...niS,width:100,background:!f('nd_nrs_pain_genChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_nrs_pain_genChk',0)?'not-allowed':undefined}}/></span>
              <span style={{ fontSize:12 }}>, 정도:</span>
              <select value={String(f('nd_nrs_pain_score','5'))} onChange={e=>{ setF('nd_nrs_pain_score',e.target.value); setF('nd_nrs_pain_none',0); }} disabled={!f('nd_nrs_pain_genChk',0)} style={{ fontSize:12, border:'1px solid #d1d5db', borderRadius:3, padding:'2px 4px', background:!f('nd_nrs_pain_genChk',0)?'#f3f4f6':'#f9fbff', cursor:!f('nd_nrs_pain_genChk',0)?'not-allowed':undefined }}>
                {Array.from({length:11},(_,i)=>String(i)).map(v=><option key={v} value={v}>{v}점</option>)}
              </select>
              <span style={{ fontSize:12 }}>[ 0점(전혀없음)~10점(매우심함) ] )</span>
            </div>
            <div style={{ marginTop:2, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_nrs_pain_cancerChk',0)} onChange={e=>{ setF('nd_nrs_pain_cancerChk',e.target.checked?1:0); setF('nd_nrs_pain_none',0); if(!e.target.checked){ setF('nd_nrs_pain_cancerPart',''); setF('nd_nrs_pain_cancerScore',''); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>암성통증
              </label>
              <span style={{ fontSize:12 }}>(부위: <input value={String(f('nd_nrs_pain_cancerPart',''))} onChange={e=>{ setF('nd_nrs_pain_cancerPart',e.target.value); setF('nd_nrs_pain_none',0); }} disabled={!f('nd_nrs_pain_cancerChk',0)} style={{...niS,width:100,background:!f('nd_nrs_pain_cancerChk',0)?'#f3f4f6':'#f9fbff',cursor:!f('nd_nrs_pain_cancerChk',0)?'not-allowed':undefined}}/></span>
              <span style={{ fontSize:12 }}>, 정도:</span>
              <select value={String(f('nd_nrs_pain_cancerScore',''))} onChange={e=>{ setF('nd_nrs_pain_cancerScore',e.target.value); setF('nd_nrs_pain_none',0); }} disabled={!f('nd_nrs_pain_cancerChk',0)} style={{ fontSize:12, border:'1px solid #d1d5db', borderRadius:3, padding:'2px 4px', background:!f('nd_nrs_pain_cancerChk',0)?'#f3f4f6':'#f9fbff', cursor:!f('nd_nrs_pain_cancerChk',0)?'not-allowed':undefined }}>
                <option value="">선택</option>
                {Array.from({length:11},(_,i)=>String(i)).map(v=><option key={v} value={v}>{v}점</option>)}
              </select>
              <span style={{ fontSize:12 }}>[ 0점(전혀없음)~10점(매우심함) ] )</span>
            </div>
            <div style={{ marginTop:4 }}>
              <span style={{ fontSize:12 }}>통증빈도 ≫ </span>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_nrs_pain_daily','nd_nrs_pain_none')}/>일 1회 이상</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_pain_weekly','nd_nrs_pain_none',1)}/>주 1회 이상</label>
            </div>
            <div style={{ marginTop:2 }}>
              <span style={{ fontSize:12 }}>통증관리 ≫</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', flexWrap:'nowrap', gap:6, marginTop:2, justifyContent:'flex-end' }}>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...jtSubChk('nd_nrs_pain_oral','nd_nrs_pain_none',1)}/>일반진통제</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...jtSubChk('nd_nrs_pain_narcOral','nd_nrs_pain_none')}/>마약성 경구 진통제</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...jtSubChk('nd_nrs_pain_narcInj','nd_nrs_pain_none')}/>마약성 주사제</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...jtSubChk('nd_nrs_pain_patch','nd_nrs_pain_none')}/>마약성 진통제 패치</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...jtSubChk('nd_nrs_pain_visit','nd_nrs_pain_none')}/>냉온요법</label>
              <label style={{ fontSize:12, whiteSpace:'nowrap' }}><input {...nrsEtcChk('nd_nrs_pain_etcChk','nd_nrs_pain_etc','nd_nrs_pain_none')}/>기타( {nrsEtcInp('nd_nrs_pain_etcChk','nd_nrs_pain_etc','nd_nrs_pain_none','',80)} )</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>마. 배뇨간호</td>
          <td style={{ ...nvS, display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
            <label style={{ fontSize:12 }}><input {...jtNoneChk('nd_nrs_uri_none',['nd_nrs_uri_cath','nd_nrs_uri_simple','nd_nrs_uri_urostomy','nd_nrs_uri_bladder','nd_nrs_uri_dialysisChk','nd_nrs_uri_hemo','nd_nrs_uri_peritoneal','nd_nrs_uri_etcChk'],['nd_nrs_uri_etc'],1)}/>없음</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_cath','nd_nrs_uri_none')}/>유치도뇨관</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_simple','nd_nrs_uri_none')}/>단순도뇨</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_urostomy','nd_nrs_uri_none')}/>요루</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_bladder','nd_nrs_uri_none')}/>방광루</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_dialysisChk','nd_nrs_uri_none')}/>투석</label>
            <span style={{ fontSize:12 }}>(</span>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_hemo','nd_nrs_uri_none')}/>혈액</label>
            <label style={{ fontSize:12 }}><input {...jtSubChk('nd_nrs_uri_peritoneal','nd_nrs_uri_none')}/>복막</label>
            <span style={{ fontSize:12 }}>)</span>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_uri_etcChk','nd_nrs_uri_etc','nd_nrs_uri_none')}/>기타( {nrsEtcInp('nd_nrs_uri_etcChk','nd_nrs_uri_etc','nd_nrs_uri_none','',80)} )</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>바. 배변간호</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_bow_none',['nd_nrs_bow_stoma','nd_nrs_bow_enema','nd_nrs_bow_etcChk'],['nd_nrs_bow_etc'],1)}/>없음</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_bow_stoma','nd_nrs_bow_none')}/>장루</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_bow_enema','nd_nrs_bow_none')}/>관장</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_bow_etcChk','nd_nrs_bow_etc','nd_nrs_bow_none')}/>기타( {nrsEtcInp('nd_nrs_bow_etcChk','nd_nrs_bow_etc','nd_nrs_bow_none','',100)} )</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>사. 내분비간호</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_nrs_endo_none',['nd_nrs_endo_insulin','nd_nrs_endo_etcChk'],['nd_nrs_endo_etc'],1)}/>없음</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_nrs_endo_insulin','nd_nrs_endo_none')}/>인슐린투여</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_nrs_endo_etcChk','nd_nrs_endo_etc','nd_nrs_endo_none')}/>기타( {nrsEtcInp('nd_nrs_endo_etcChk','nd_nrs_endo_etc','nd_nrs_endo_none','',120)} )</label>
          </td>
        </tr>
      </tbody></table>
      {opinBox('nd_opinion5', '아. 의견 및 판단근거', '- 평소 허리와 어깨 부위에 상시적인 통증을 호소하심. 현재 병원에서 처방받은 일반 진통제(탁센)를 복용하고 있으며, 약물 복용 시기를 놓치지 않도록 관리함과 동시에 온찜질 등의 비약물적 요법을 병행하며 통증 완화를 도울 수 있도록 함.\n- 특수 간호가 요구되는 상태는 아니나, 여러 종류의 약을 복용 중이므로 약물 상호작용에 따른 부작용(소화불량, 어지러움 등)이 나타나는지 세심한 관찰이 필요함.')}

      {/* ═══ 6. 인지 및 의사소통 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>6. 인지 및 의사소통</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }}>가. 인지기능</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            {/* 1줄: 양호 */}
            <div style={{ marginBottom:3 }}>
              <label style={{ fontSize:12 }}><input {...jtNoneChk('nd_cog_good',['nd_cog_memChk','nd_cog_shortMem','nd_cog_longMem','nd_cog_oriChk','nd_cog_time','nd_cog_place','nd_cog_person','nd_cog_judge','nd_cog_understand','nd_cog_attention'],undefined,1)}/>양호</label>
            </div>
            {/* 2줄: 기억력·지남력·판단력·이해력·주의력 */}
            <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_cog_memChk',0)} onChange={e=>{ setF('nd_cog_memChk',e.target.checked?1:0); setF('nd_cog_good',0); if(!e.target.checked){ setF('nd_cog_shortMem',0); setF('nd_cog_longMem',0); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>기억력 저하
              </label>
              <span style={{ fontSize:12 }}>(</span>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_cog_shortMem',0)} onChange={e=>{ setF('nd_cog_shortMem',e.target.checked?1:0); if(e.target.checked){ setF('nd_cog_good',0); setF('nd_cog_memChk',1); } }} disabled={!f('nd_cog_memChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_cog_memChk',0)?'not-allowed':undefined}}/>단기</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_cog_longMem',0)} onChange={e=>{ setF('nd_cog_longMem',e.target.checked?1:0); if(e.target.checked){ setF('nd_cog_good',0); setF('nd_cog_memChk',1); } }} disabled={!f('nd_cog_memChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_cog_memChk',0)?'not-allowed':undefined}}/>장기</label>
              <span style={{ fontSize:12 }}>)</span>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_cog_oriChk',0)} onChange={e=>{ setF('nd_cog_oriChk',e.target.checked?1:0); setF('nd_cog_good',0); if(!e.target.checked){ setF('nd_cog_time',0); setF('nd_cog_place',0); setF('nd_cog_person',0); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>지남력 저하
              </label>
              <span style={{ fontSize:12 }}>(</span>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_cog_time',0)} onChange={e=>{ setF('nd_cog_time',e.target.checked?1:0); if(e.target.checked){ setF('nd_cog_good',0); setF('nd_cog_oriChk',1); } }} disabled={!f('nd_cog_oriChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_cog_oriChk',0)?'not-allowed':undefined}}/>시간</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_cog_place',0)} onChange={e=>{ setF('nd_cog_place',e.target.checked?1:0); if(e.target.checked){ setF('nd_cog_good',0); setF('nd_cog_oriChk',1); } }} disabled={!f('nd_cog_oriChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_cog_oriChk',0)?'not-allowed':undefined}}/>장소</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_cog_person',0)} onChange={e=>{ setF('nd_cog_person',e.target.checked?1:0); if(e.target.checked){ setF('nd_cog_good',0); setF('nd_cog_oriChk',1); } }} disabled={!f('nd_cog_oriChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_cog_oriChk',0)?'not-allowed':undefined}}/>사람</label>
              <span style={{ fontSize:12 }}>)</span>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_cog_judge','nd_cog_good')}/>판단력 저하</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_cog_understand','nd_cog_good')}/>이해력 저하</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_cog_attention','nd_cog_good')}/>주의력 저하</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>나. 행동증상</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            {/* 1줄: 없음 */}
            <div style={{ marginBottom:3 }}>
              <label style={{ fontSize:12 }}><input {...jtNoneChk('nd_beh_none',['nd_beh_delusion','nd_beh_hallucin','nd_beh_lost','nd_beh_resist','nd_beh_irregSleep','nd_beh_pacing','nd_beh_aggressChk','nd_beh_verbal','nd_beh_nonverbal','nd_beh_inappropriate','nd_beh_dirty','nd_beh_eatingChange','nd_beh_undress','nd_beh_repeat'],undefined,1)}/>없음</label>
            </div>
            {/* 2줄: 나머지 모두 */}
            <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_delusion','nd_beh_none')}/>망상</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_hallucin','nd_beh_none')}/>환각(환청·환시 등)</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_lost','nd_beh_none')}/>길 잃음</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_resist','nd_beh_none')}/>도움에 저항</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_irregSleep','nd_beh_none')}/>불규칙 수면</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_pacing','nd_beh_none')}/>배회</label>
              <label style={{ fontSize:12 }}>
                <input type="checkbox" checked={!!f('nd_beh_aggressChk',0)} onChange={e=>{ setF('nd_beh_aggressChk',e.target.checked?1:0); setF('nd_beh_none',0); if(!e.target.checked){ setF('nd_beh_verbal',0); setF('nd_beh_nonverbal',0); } }} style={{marginRight:4,accentColor:'#16a34a'}}/>공격성
              </label>
              <span style={{ fontSize:12 }}>(</span>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_beh_verbal',0)} onChange={e=>{ setF('nd_beh_verbal',e.target.checked?1:0); if(e.target.checked){ setF('nd_beh_none',0); setF('nd_beh_aggressChk',1); } }} disabled={!f('nd_beh_aggressChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_beh_aggressChk',0)?'not-allowed':undefined}}/>언어적</label>
              <label style={{ fontSize:12 }}><input type="checkbox" checked={!!f('nd_beh_nonverbal',0)} onChange={e=>{ setF('nd_beh_nonverbal',e.target.checked?1:0); if(e.target.checked){ setF('nd_beh_none',0); setF('nd_beh_aggressChk',1); } }} disabled={!f('nd_beh_aggressChk',0)} style={{marginRight:4,accentColor:'#16a34a',cursor:!f('nd_beh_aggressChk',0)?'not-allowed':undefined}}/>비언어적</label>
              <span style={{ fontSize:12 }}>)</span>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_inappropriate','nd_beh_none')}/>부적절한 행동</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_dirty','nd_beh_none')}/>불결행동</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_eatingChange','nd_beh_none')}/>식습관 변화</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_undress','nd_beh_none')}/>부적절한 옷 입기</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_beh_repeat','nd_beh_none')}/>반복적인 말·행동</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>다. 심리증상</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_psy_none',['nd_psy_depressed','nd_psy_apathy','nd_psy_anxiety','nd_psy_etcChk'],['nd_psy_etc'])}/>없음</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_psy_depressed','nd_psy_none',1)}/>우울감</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_psy_apathy','nd_psy_none')}/>무기력·무감동</label>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtSubChk('nd_psy_anxiety','nd_psy_none')}/>불안·초조</label>
            <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_psy_etcChk','nd_psy_etc','nd_psy_none')}/>기타( {nrsEtcInp('nd_psy_etcChk','nd_psy_etc','nd_psy_none','',100)} )</label>
          </td>
        </tr>
      </tbody></table>

      {/* 라. 의사소통 */}
      {(() => {
        const commBtn = (key: string, def: string | number, labels: string[]) => {
          const cur = String(f(key, def));
          return (
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              {labels.map((lbl, i) => {
                const v = String(i);
                const on = cur === v;
                return (
                  <button key={v} type="button" onClick={() => { setF(key, v); setIsDirty(true); }}
                    title={lbl}
                    style={{ minWidth:22, height:22, borderRadius:3, border:`1px solid ${on?'#2563eb':'#d1d5db'}`,
                      background: on ? '#2563eb' : '#f9fbff', color: on ? '#fff' : '#475569',
                      fontSize:12, fontWeight:700, cursor:'pointer', padding:'0 4px', lineHeight:1 }}>
                    {v}
                  </button>
                );
              })}
              <span style={{ fontSize:10, color:'#64748b', marginLeft:4 }}>
                {labels.map((lbl,i)=>`${i}:${lbl}`).join(' · ')}
              </span>
            </div>
          );
        };
        return (
          <table style={ntbl}><tbody>
            <tr>
              <td style={{ ...nlS, width:'16%', verticalAlign:'top' }} rowSpan={4}>라. 의사소통</td>
              <td style={{ ...nlS, width:'12%' }}>1) 이해능력</td>
              <td style={nvS}>{commBtn('nd_comm_understand','0',['양호','약간 어려움','단순 소통만 가능','이해 못함','측정불가'])}</td>
            </tr>
            <tr>
              <td style={nlS}>2) 표현능력</td>
              <td style={nvS}>{commBtn('nd_comm_express','0',['양호','약간 어려움','단순 표현만 가능','표현 못함','측정불가'])}</td>
            </tr>
            <tr>
              <td style={nlS}>3) 시력상태</td>
              <td style={nvS}>
                {commBtn('nd_comm_vision','0',['양호','1m거리 보임','근접한 사물 보임','보이지 않음','판단불가'])}
                <div style={{ marginTop:2 }}>
                  <label style={{ fontSize:12 }}><input {...chk('nd_comm_glasses')}/>안경 사용</label>
                  <span style={{ fontSize:10, color:'#64748b', marginLeft:8 }}>* 안경 착용 상태 기준으로 판단</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style={nlS}>4) 청력상태</td>
              <td style={nvS}>
                {commBtn('nd_comm_hearing','0',['양호','먼 곳 소리 안 들림','큰 소리만 들림','들리지 않음','판단불가'])}
                <div style={{ marginTop:2 }}>
                  <label style={{ fontSize:12 }}><input {...chk('nd_comm_hearingAid')}/>보청기 사용</label>
                  <span style={{ fontSize:10, color:'#64748b', marginLeft:8 }}>* 보청기 착용 상태 기준으로 판단</span>
                </div>
              </td>
            </tr>
          </tbody></table>
        );
      })()}
      {opinBox('nd_opinion6', '마. 의견 및 판단근거', '- 현재 인지 상태가 매우 명확하며 본인의 의사를 정확히 표현할 수 있는 상태임. 매일 성경책을 정독하실 정도로 높은 인지 수준을 유지하고 있으므로, 이를 적극 활용한 자기 주도적 활동을 돌려하며 현재의 인지 기능을 안정적으로 유지함.\n- 배우자 사별 후 느끼시는 외로움과 고립감을 완화하기 위해 요양보호사의 따뜻한 말벗 지원과 정서적 지지가 필수적임. 자녀분들의 잦은 전화 안부와 방문이 심리적 안정에 도움이 되고 있으므로 가족과의 유대 관계 유지를 적극 지원함.')}

      {/* ═══ 7. 수급자의 가족 및 지지체계 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>7. 수급자의 가족 및 지지체계</div>
      <div style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderBottom:cb, background:hBg }}>가. 주거상태</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%' }}>1) 수급자의<br/>주거형태</td>
          <td style={nvS}>
            {[['own','자택'],['nursing','노인요양시설(노인요양공동생활가정 포함)'],['senior','양로시설'],['hospital','요양병원']].map(([v,l])=>(
              <label key={v} style={{ fontSize:12, marginRight:8 }}>
                <input type="radio" name="nd_home_type" checked={String(f('nd_home_type','own'))===v} onChange={()=>{ setF('nd_home_type',v); setF('nd_home_etc',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>{l}
              </label>
            ))}
            <label style={{ fontSize:12 }}>
              <input type="radio" name="nd_home_type" checked={String(f('nd_home_type','own'))==='etc'} onChange={()=>setF('nd_home_type','etc')} style={{marginRight:3,accentColor:'#16a34a'}}/>기타( <input value={String(f('nd_home_etc',''))} onChange={e=>setF('nd_home_etc',e.target.value)} disabled={String(f('nd_home_type','own'))!=='etc'} style={{...niS,width:120,background:String(f('nd_home_type','own'))!=='etc'?'#f3f4f6':'#f9fbff',cursor:String(f('nd_home_type','own'))!=='etc'?'not-allowed':undefined}}/> )
            </label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>2) 동거인</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_alone',1)}/>독거</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_spouse')}/>배우자</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_child')}/>자녀</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_inlaw')}/>며느리·사위</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_sibling')}/>형제·자매</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_grandchild')}/>손자녀</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_parent')}/>부모</label>
            <label style={{ fontSize:12, marginRight:6 }}><input {...chk('nd_cohabit_relative')}/>친척</label>
            <label style={{ fontSize:12 }}><input {...etcChk('nd_cohabit_etcChk','nd_cohabit_etc')}/>기타( {etcInp('nd_cohabit_etcChk','nd_cohabit_etc','',100)} )</label>
          </td>
        </tr>
      </tbody></table>

      <div style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderBottom:cb, background:hBg }}>나. 수급자의 지지체계</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%' }}>1) 자녀</td>
          <td style={nvS}>
            <label style={{ fontSize:12, marginRight:8 }}><input type="radio" name="nd_child_yn" checked={String(f('nd_child_yn','none'))==='none'} onChange={()=>{ setF('nd_child_yn','none'); setF('nd_child_son',''); setF('nd_child_daughter',''); }} style={{marginRight:3,accentColor:'#16a34a'}}/>없음</label>
            <label style={{ fontSize:12, marginRight:4 }}><input type="radio" name="nd_child_yn" checked={String(f('nd_child_yn','none'))==='has'} onChange={()=>setF('nd_child_yn','has')} style={{marginRight:3,accentColor:'#16a34a'}}/>있음</label><span style={{ fontSize:12 }}>(아들: </span><input value={String(f('nd_child_son','2'))} onChange={e=>{ setF('nd_child_son',e.target.value); if(e.target.value) setF('nd_child_yn','has'); }} style={{...niS,width:30,textAlign:'center'}}/>
            <span style={{ fontSize:12 }}> 명, 딸: </span><input value={String(f('nd_child_daughter','4'))} onChange={e=>{ setF('nd_child_daughter',e.target.value); if(e.target.value) setF('nd_child_yn','has'); }} style={{...niS,width:30,textAlign:'center'}}/><span style={{ fontSize:12 }}> 명)</span>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>2) 주 수발자</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_carer_none',['nd_carer_spouse','nd_carer_child','nd_carer_inlaw','nd_carer_sibling','nd_carer_grandchild','nd_carer_parent','nd_carer_relative','nd_carer_etcChk'],['nd_carer_etc','nd_carer_burden'],1)}/>없음</label>
            <div style={{ marginTop:4, marginLeft:8 }}>
              <span style={{ fontSize:12, fontWeight:600, marginRight:8 }}>가) 주 수발자의 관계</span>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_spouse','nd_carer_none')}/>배우자</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_child','nd_carer_none')}/>자녀</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_inlaw','nd_carer_none')}/>며느리·사위</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_sibling','nd_carer_none')}/>형제·자매</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_grandchild','nd_carer_none')}/>손자녀</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_parent','nd_carer_none')}/>부모</label>
              <label style={{ fontSize:12, marginRight:6 }}><input {...jtSubChk('nd_carer_relative','nd_carer_none')}/>친척</label>
              <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_carer_etcChk','nd_carer_etc','nd_carer_none')}/>기타( {nrsEtcInp('nd_carer_etcChk','nd_carer_etc','nd_carer_none','',50)} )</label>
            </div>
            <div style={{ marginTop:4, marginLeft:8 }}>
              <span style={{ fontSize:12, fontWeight:600, marginRight:8 }}>나) 주 수발자의 부양부담</span>
              {(['noBurden','sometimes','often','selfBurden','always'] as const).map((v,i,arr)=>(
                <label key={v} style={{ fontSize:12, marginRight: i===arr.length-1?0:6 }}>
                  <input type="radio" name="nd_carer_burden" checked={String(f('nd_carer_burden','noBurden'))===v} onChange={()=>{ setF('nd_carer_burden',v); setF('nd_carer_none',0); }} style={{marginRight:3,accentColor:'#16a34a'}}/>
                  {['전혀 부담되지 않음','아주 가끔 부담됨','가끔 부담됨','자주 부담됨','항상 부담됨'][i]}
                </label>
              ))}
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>3) 수급자의<br/>사회적교류</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12, marginRight:8 }}>하루종일 혼자있음</span>
              <label style={{ fontSize:12, marginRight:6 }}><input {...rad('nd_social_alone','예','예')}/>예</label>
              <label style={{ fontSize:12 }}><input {...rad('nd_social_alone','아니오')}/>아니오</label>
            </div>
            <div style={{ marginBottom:4 }}>
              <span style={{ fontSize:12, marginRight:8, display:'inline-block', width:80 }}>가족 교류</span>
              {['주1~2회','월1~2회','분기1~2회','연1~2회','없음'].map(v=>(
                <label key={v} style={{ fontSize:12, marginRight:6 }}><input {...rad('nd_social_family',v,'주1~2회')}/>{v}</label>
              ))}
            </div>
            <div>
              <span style={{ fontSize:12, marginRight:8, display:'inline-block', width:80 }}>친구·이웃 교류</span>
              {['주1~2회','월1~2회','분기1~2회','연1~2회','없음'].map(v=>(
                <label key={v} style={{ fontSize:12, marginRight:6 }}><input {...rad('nd_social_friend',v,'주1~2회')}/>{v}</label>
              ))}
            </div>
          </td>
        </tr>
      </tbody></table>

      {/* 다. 현재 이용 중인 지역사회 자원 */}
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }}>다. 현재 이용 중인<br/>지역사회 자원</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <label style={{ fontSize:12, marginRight:8 }}><input {...jtNoneChk('nd_comm_resNone',['nd_comm_resCustomChk','nd_comm_resSenior','nd_comm_resHealth','nd_comm_resFood','nd_comm_resTransport','nd_comm_resHousing','nd_comm_resBeauty','nd_comm_resDisabled','nd_comm_resReligion','nd_comm_resEtcChk'],['nd_comm_resCustom','nd_comm_resEtc'],1)}/>없음</label>
            <div style={{ marginTop:4 }}>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resCustomChk','nd_comm_resNone')}/>노인맞춤돌봄서비스(서비스 내용: </label>{jtPartInp('nd_comm_resCustom','nd_comm_resNone','',140)}<span style={{ fontSize:12 }}> )</span>
            </div>
            <div style={{ marginTop:4, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resSenior','nd_comm_resNone')}/>노인복지관</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resHealth','nd_comm_resNone')}/>보건의료서비스(보건소, 치매안심센터 등)</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resFood','nd_comm_resNone')}/>식사지원(급식 및 도시락 배달 등)</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resTransport','nd_comm_resNone')}/>이동지원서비스(차량지원, 무료택시 등)</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resHousing','nd_comm_resNone')}/>주거지원서비스(도배, 장판, 주택개조 등)</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resBeauty','nd_comm_resNone')}/>이미용서비스</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resDisabled','nd_comm_resNone')}/>장애인활동지원서비스</label>
              <label style={{ fontSize:12 }}><input {...jtSubChk('nd_comm_resReligion','nd_comm_resNone')}/>종교단체 지원</label>
            </div>
            <div style={{ marginTop:4 }}>
              <label style={{ fontSize:12 }}><input {...nrsEtcChk('nd_comm_resEtcChk','nd_comm_resEtc','nd_comm_resNone')}/>기타( {nrsEtcInp('nd_comm_resEtcChk','nd_comm_resEtc','nd_comm_resNone','',200)} )</label>
            </div>
          </td>
        </tr>
      </tbody></table>
      {opinBox('nd_opinion7', '라. 의견 및 판단근거', '- 배우자 사별 후 현재 자택에서 독거 중이심. 주거 형태가 자택이나 독거 상태이므로 응급 상황 발생 시 대처가 어려울 수 있음. 요양보호사의 방문 시마다 안전 상태를 철저히 확인하고, 정서적 고립감을 완화하기 위한 지지적 관계 형성이 필요함.\n- 홀로 생활하고 계시나, 자녀들이 주 1~2회 이상 정기적으로 방문하고 있으며, 매일 전화 안부를 통해 어르신의 상태를 면밀히 살피고 있음.')}

      {/* ═══ 8. 수급자가 거주하는 곳의 환경 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>
        8. 수급자가 거주하는 곳의 환경 <span style={{ fontSize:12, fontWeight:400, color:'#dc2626' }}>※ 시설급여기관은 해당하지 않습니다.</span>
      </div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'30%' }}>가. 수급자가 거주하는 곳의 층수</td>
          <td style={nvS}>
            {['지층','1층','2층','3층 이상'].map(v=>(
              <label key={v} style={{ fontSize:12, marginRight:8 }}><input {...rad('nd_env_floor',v,'1층')}/>{v}</label>
            ))}
          </td>
        </tr>
      </tbody></table>
      <div style={{ fontSize:12, fontWeight:600, padding:'4px 10px', borderBottom:cb, background:hBg }}>나. 생활환경</div>
      <table style={ntbl}>
        <thead><tr>
          <td style={{ ...nlS, width:'22%', textAlign:'center' }}>주거환경</td>
          <td style={{ ...nlS, width:'18%', textAlign:'center' }}>상태</td>
          <td style={{ ...nlS, width:'22%', textAlign:'center' }}>주거환경</td>
          <td style={{ ...nlS, width:'18%', textAlign:'center' }}>상태</td>
        </tr></thead>
        <tbody>
          {[
            { l1:'1) 엘리베이터', k1:'nd_env_elevator', o1:['있음','없음'], d1:'없음', l2:'7) 주방 상태', k2:'nd_env_kitchen', o2:['양호','불량'], d2:'양호' },
            { l1:'2) 실내 외 계단', k1:'nd_env_stairs', o1:['있음','없음'], d1:'없음', l2:'8) 화장실 위치', k2:'nd_env_toiletLoc', o2:['실내','실외'], d2:'실내' },
            { l1:'3) 실내 장애물(문턱)', k1:'nd_env_obstacle', o1:['있음','없음'], d1:'없음', l2:'9) 좌변기', k2:'nd_env_seatToilet', o2:['있음','없음'], d2:'있음' },
            { l1:'4) 바닥 벽지', k1:'nd_env_floor2', o1:['양호','불량'], d1:'양호', l2:'10) 온수', k2:'nd_env_hotWater', o2:['있음','없음'], d2:'있음' },
            { l1:'5) 냉·난방 및 환기', k1:'nd_env_heating', o1:['양호','불량'], d1:'양호', l2:'11) 샤워기', k2:'nd_env_shower', o2:['있음','없음'], d2:'없음' },
            { l1:'6) 조명', k1:'nd_env_light', o1:['양호','불량'], d1:'양호', l2:'12) 세면대', k2:'nd_env_sink', o2:['있음','없음'], d2:'없음' },
          ].map((row, idx) => (
            <tr key={idx}>
              <td style={nvS}>{row.l1}</td>
              <td style={nvS}>{row.o1.map(o=>(<label key={o} style={{ fontSize:12, marginRight:6 }}><input {...rad(row.k1,o,row.d1)}/>{o}</label>))}</td>
              <td style={nvS}>{row.l2}</td>
              <td style={nvS}>{row.o2.map(o=>(<label key={o} style={{ fontSize:12, marginRight:6 }}><input {...rad(row.k2,o,row.d2)}/>{o}</label>))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {opinBox('nd_opinion8', '다. 의견 및 판단근거', '- 오래전부터 운영하시던 식당건물에 거주하고 계시며, 거주하시는 공간이 크지 않지만 냉난방이 잘 되어 있음.\n- 자녀분들께서 수시로 들러 어르신 주거환경을 점검하여 어르신께서 거주하시는데 불편함이 없도록 신경을 많이 써드리고 있음.')}

      {/* ═══ 9. 수급자 및 보호자가 희망하는 서비스 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>9. 수급자 및 보호자가 희망하는 서비스</div>
      <table style={ntbl}><tbody>
        <tr>
          <td style={{ ...nlS, width:'16%', verticalAlign:'top' }}>가. 신체활동 지원</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ marginBottom:4 }}>
              <label style={{ fontSize:12, marginRight:4 }}><input {...chk('nd_svc_phy_hygiene')}/>개인위생(</label>
              {['세면','구강청결','몸단장','머리감기','옷 갈아입기'].map((v, i, arr)=>(
                <label key={v} style={{ fontSize:12, marginRight: i===arr.length-1 ? 0 : 6 }}><input {...chk(`nd_svc_phy_${v}`)}/>{v}</label>
              ))}
              <span style={{ fontSize:12 }}>)</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_bath',1)}/>몸 씻기(목욕)</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_posChange')}/>체위변경하기</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_eating')}/>식사하기(식사도움)</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_mobility',1)}/>이동도움(부축, 휠체어 등)</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_toiletHelp')}/>화장실 이용하기(이동변기, 기저귀 교환 등)</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>나. 일상생활 지원</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_mealPrep',1)}/>식사 준비 및 정리</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_cleaning',1)}/>청소·주변정돈</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_laundry',1)}/>의복 세탁 및 관리</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_shopping',1)}/>장보기</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_medHelp',1)}/>복약도움</label>
              <label style={{ fontSize:12, display:'flex', alignItems:'center', flexWrap:'wrap', gap:4 }}>
                <span style={{ display:'flex', alignItems:'center' }}>
                  <input type="checkbox" checked={!!f('nd_svc_outChk',0)} onChange={e=>{ setF('nd_svc_outChk',e.target.checked?1:0); if(!e.target.checked){ setF('nd_svc_hospital',0); setF('nd_svc_office',0); setF('nd_svc_walk',0); setF('nd_svc_outEtcChk',0); setF('nd_svc_outEtc',''); } }} style={{ marginRight:4, accentColor:'#16a34a' }}/>외출동행(
                </span>
                <input type="checkbox" checked={!!f('nd_svc_hospital',0)} onChange={e=>{ setF('nd_svc_hospital',e.target.checked?1:0); if(e.target.checked) setF('nd_svc_outChk',1); }} disabled={!f('nd_svc_outChk',0)} style={{ marginRight:3, accentColor:'#16a34a', cursor:!f('nd_svc_outChk',0)?'not-allowed':undefined }}/>병원
                <input type="checkbox" checked={!!f('nd_svc_office',0)} onChange={e=>{ setF('nd_svc_office',e.target.checked?1:0); if(e.target.checked) setF('nd_svc_outChk',1); }} disabled={!f('nd_svc_outChk',0)} style={{ marginLeft:4, marginRight:3, accentColor:'#16a34a', cursor:!f('nd_svc_outChk',0)?'not-allowed':undefined }}/>관공서
                <input type="checkbox" checked={!!f('nd_svc_walk',0)} onChange={e=>{ setF('nd_svc_walk',e.target.checked?1:0); if(e.target.checked) setF('nd_svc_outChk',1); }} disabled={!f('nd_svc_outChk',0)} style={{ marginLeft:4, marginRight:3, accentColor:'#16a34a', cursor:!f('nd_svc_outChk',0)?'not-allowed':undefined }}/>산책
                <input type="checkbox" checked={!!f('nd_svc_outEtcChk',0)} onChange={e=>{ setF('nd_svc_outEtcChk',e.target.checked?1:0); if(e.target.checked) setF('nd_svc_outChk',1); if(!e.target.checked) setF('nd_svc_outEtc',''); }} disabled={!f('nd_svc_outChk',0)} style={{ marginLeft:4, marginRight:3, accentColor:'#16a34a', cursor:!f('nd_svc_outChk',0)?'not-allowed':undefined }}/>기타( <input value={String(f('nd_svc_outEtc',''))} onChange={e=>{ setF('nd_svc_outEtc',e.target.value); if(e.target.value) setF('nd_svc_outEtcChk',1); }} disabled={!f('nd_svc_outEtcChk',0) || !f('nd_svc_outChk',0)} style={{...niS,width:50,background:(!f('nd_svc_outEtcChk',0)||!f('nd_svc_outChk',0))?'#f3f4f6':'#f9fbff',cursor:(!f('nd_svc_outEtcChk',0)||!f('nd_svc_outChk',0))?'not-allowed':undefined}}/> ))
              </label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>다. 기능회복훈련</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_physTrain',1)}/>신체기능 훈련</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_dailyTrain')}/>일상생활 동작 훈련</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_cogTrain')}/>인지기능 향상 훈련</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_leisure')}/>여가·정서프로그램</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_physio')}/>물리치료</label>
              <label style={{ fontSize:12 }}><input {...chk('nd_svc_occup')}/>작업치료</label>
              <label style={{ fontSize:12 }}><input {...etcChk('nd_svc_rehabEtcChk','nd_svc_rehabEtc')}/>기타( {etcInp('nd_svc_rehabEtcChk','nd_svc_rehabEtc','',100)} )</label>
            </div>
          </td>
        </tr>
        <tr>
          <td style={nlS}>라. 인지관리 및<br/>정서지원</td>
          <td style={nvS}>
            <label style={{ fontSize:11, marginRight:12 }}><input {...chk('nd_svc_cogCare')}/>인지관리지원</label>
            <label style={{ fontSize:11, marginRight:12 }}><input {...chk('nd_svc_emotional',1)}/>정서지원</label>
            <label style={{ fontSize:11 }}><input {...etcChk('nd_svc_cogEmotEtcChk','nd_svc_cogEmotEtc')}/>기타( {etcInp('nd_svc_cogEmotEtcChk','nd_svc_cogEmotEtc','',180)} )</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>마. 건강 및<br/>간호관리</td>
          <td style={nvS}>
            <label style={{ fontSize:11, marginRight:8 }}><input {...chk('nd_svc_healthMgmt',1)}/>건강관리(투약관리 및 기초건강관리 등)</label>
            <label style={{ fontSize:11 }}><input {...chk('nd_svc_nursingCare')}/>간호관리(욕창, 통증, 호흡기, 구강간호 등)</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>바. 방문목욕</td>
          <td style={nvS}>
            <label style={{ fontSize:11, marginRight:8 }}><input {...chk('nd_svc_visitBathCar')}/>차량을 이용한 방문목욕</label>
            <label style={{ fontSize:11 }}><input {...chk('nd_svc_visitBathNoCar')}/>차량을 이용하지 않은 방문목욕</label>
          </td>
        </tr>
        <tr>
          <td style={nlS}>사. 복지용구</td>
          <td style={nvS}>
            <span style={{ fontSize:11 }}>희망품목( </span>{nInp('nd_svc_welfare','안전손잡이, 미끄럼방지매트',280)}<span style={{ fontSize:11 }}> )</span>
          </td>
        </tr>
        <tr>
          <td style={{ ...nlS, verticalAlign:'top' }}>아. 장기요양급여 외<br/>희망하는 지역사회<br/>자원</td>
          <td style={{ ...nvS, verticalAlign:'top' }}>
            <label style={{ fontSize:11, marginRight:8 }}><input {...jtNoneChk('nd_svc_commNone',['nd_svc_commHealth','nd_svc_commSenior','nd_svc_commTransport','nd_svc_commFood','nd_svc_commBeauty','nd_svc_commHousing','nd_svc_commDisabled','nd_svc_commReligion','nd_svc_commEtcChk'],['nd_svc_commEtc'],1)}/>없음</label>
            <div style={{ marginTop:4, display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commHealth','nd_svc_commNone')}/>보건의료서비스(보건소, 치매안심센터 등)</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commSenior','nd_svc_commNone')}/>노인복지관</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commTransport','nd_svc_commNone')}/>이동지원서비스(차량지원, 무료택시 등)</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commFood','nd_svc_commNone')}/>식사지원(급식 및 도시락 배달 등)</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commBeauty','nd_svc_commNone')}/>이미용서비스</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commHousing','nd_svc_commNone')}/>주거지원서비스(도배, 장판, 주택개조 등)</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commDisabled','nd_svc_commNone')}/>장애인활동지원서비스</label>
              <label style={{ fontSize:11 }}><input {...jtSubChk('nd_svc_commReligion','nd_svc_commNone')}/>종교단체 지원</label>
            </div>
            <div style={{ marginTop:4 }}>
              <label style={{ fontSize:11 }}><input {...nrsEtcChk('nd_svc_commEtcChk','nd_svc_commEtc','nd_svc_commNone')}/>기타( {nrsEtcInp('nd_svc_commEtcChk','nd_svc_commEtc','nd_svc_commNone','',200)} )</label>
            </div>
          </td>
        </tr>
      </tbody></table>
      {opinBox('nd_opinion9', '자. 의견 및 판단근거', '- 고령 및 다발적인 관절 수술(무릎, 고관절, 양팔꿈치)로 인해 스스로 몸을 씻거나 안전하게 이동하는데 낙상 위험이 매우 높아(14점) 이동 시 전문적인 부축을 희망하심.\n- 독거 상태로 청소, 취사, 장보기 등 가사 활동 수행이 불가능하며, 위암 수술 후 저하된 기능을 보호하기 위한 영양 관리가 필요한 상태임. 또한 규칙적인 투약 관리가 필수적인 상황임.')}

      {/* ═══ 10. 종합의견 ═══ */}
      <div style={{ fontSize:12, fontWeight:700, color:'#166534', padding:'8px 10px', borderBottom:cb }}>10. 종합의견</div>
      <div style={{ padding:'8px 10px' }}>
        <textarea rows={10} value={String(f('nd_totalOpinion','- 수급자께서는 87세의 고령으로 고혈압, 고지혈증 등 만성질환과 위암 수술 이력이 있으며, 허리 협착증 및 다발적인 관절 수술(무릎, 고관절, 양팔꿈치)로 인해 지체장애 5등급을 판정 받은 상태이심. 낙상 위험도 측정 결과 14점(아주 높음)으로 나타나 실내외 이동 시 반드시 보행기(워커) 사용과 요양보호사의 밀착 부축이 필요함. 비교적 자유로운 상지 기능을 활용하여 할 수 있는 부분(얼굴 위생 등)은 자립을 독려하고, 실내 스트레칭을 통해 관절 구축을 예방할 수 있도록 함.\n- 위암 수술 이후 소화 기능이 크게 저하되어 식사량이 이전보다 줄어든 상태이며, 유제품(치즈 등)에 대한 거부감이 뚜렷한 편이심. 영양 불균형을 예방하기 위해 소화가 용이한 부드러운 식단과 어르신이 선호하시는 식재료를 활용한 메뉴를 제공하여 섭취량을 늘릴 수 있도록 함. 또한, 만성질환 관리를 위한 정기적 약(고혈압, 고지혈증 등)과 진통제의 종류가 많아 투약 및 응급의 투약의 위험이 있으므로, 요양보호사의 정확한 투약 보조와 약물 부작용(어지러움, 탈진 등)에 대한 지속적인 관찰이 필요함.\n- 인지 기능은 매일 성경책을 정독하실 정도로 매우 양호하며, 본인의 의사를 명확히 소통할 수 있는 능력을 갖추고 있으심. 다만, 배우자 사별 후 홀로 거주하며 느끼는 고립감과 우울감이 종종 관찰되므로, 말벗 지원과 어르신이 선호하시는 성경 읽기 활동을 통해 정서적 안정감 드리고 자존감을 유지하도록 돕는 것이 중요함.'))} onChange={e=>setF('nd_totalOpinion',e.target.value)} placeholder="수급자의 전반적 상태, 욕구, 서비스 방향 등 종합의견을 작성하세요" style={ntS}/>
      </div>
    </div>
  );
}
