import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter } from 'lucide-react';
import { recipients, careWorkers, formatKRW, getCertNo, getLegalDob, getValidFrom, getValidTo, getGradeNum, getGradeText, getServiceTypes } from './mockData';
import { SharedDataBadge } from './SharedDataBadge';

// ── 디자인 토큰 ──────────────────────────
const TH: CSSProperties = {
  background: '#152e50',
  color: 'rgba(255,255,255,0.88)',
  fontSize: 11,
  fontWeight: 600,
  height: 34,
  padding: '0 10px',
  whiteSpace: 'nowrap',
};

export function RecipientList() {
  const navigate = useNavigate();
  const [query, setQuery]           = useState('');
  const [filterGrade, setFilterGrade]   = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const filtered = recipients.filter(r => {
    const q = query.trim();
    const matchQ = q === '' || r.name.includes(q) || getCertNo(r).includes(q) || getLegalDob(r).includes(q);
    const matchG = filterGrade === 'all' || getGradeNum(r) === Number(filterGrade);
    const matchS = filterStatus === 'all' || r.status === filterStatus;
    return matchQ && matchG && matchS;
  });

  const grades = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* ── 필터 바 ── */}
      <div style={{
        flexShrink: 0, background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Filter size={12} color="#94a3b8" />

        {/* 상태 필터 버튼 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { value: 'all',      label: '전체' },
            { value: 'active',   label: '활성' },
            { value: 'inactive', label: '비활성' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              style={{
                fontSize: 10, padding: '2px 10px', borderRadius: 16, cursor: 'pointer',
                borderWidth: 1, borderStyle: 'solid',
                background: filterStatus === opt.value
                  ? (opt.value === 'active' ? '#f0fdf4' : opt.value === 'inactive' ? '#fff1f2' : '#dbeafe')
                  : '#ffffff',
                color: filterStatus === opt.value
                  ? (opt.value === 'active' ? '#059669' : opt.value === 'inactive' ? '#dc2626' : '#1d4ed8')
                  : '#64748b',
                borderColor: filterStatus === opt.value
                  ? (opt.value === 'active' ? '#a7f3d0' : opt.value === 'inactive' ? '#fecaca' : '#bfdbfe')
                  : '#e2e8f0',
                fontWeight: filterStatus === opt.value ? 700 : 400,
              }}
            >{opt.label}</button>
          ))}
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 14, background: '#e2e8f0' }} />

        {/* 등급 필터 */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setFilterGrade('all')}
            style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 16, cursor: 'pointer',
              background: filterGrade === 'all' ? '#dbeafe' : '#ffffff',
              color: filterGrade === 'all' ? '#1d4ed8' : '#64748b',
              border: `1px solid ${filterGrade === 'all' ? '#bfdbfe' : '#e2e8f0'}`,
              fontWeight: filterGrade === 'all' ? 700 : 400,
            }}
          >전체 등급</button>
          {grades.map(g => (
            <button
              key={g}
              onClick={() => setFilterGrade(String(g))}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 16, cursor: 'pointer',
                background: filterGrade === String(g) ? '#dbeafe' : '#ffffff',
                color: filterGrade === String(g) ? '#1d4ed8' : '#64748b',
                border: `1px solid ${filterGrade === String(g) ? '#bfdbfe' : '#e2e8f0'}`,
                fontWeight: filterGrade === String(g) ? 700 : 400,
              }}
            >{g}등급</button>
          ))}
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 14, background: '#e2e8f0' }} />

        {/* 검색 */}
        <div style={{ position: 'relative' }}>
          <Search size={11} color="#94a3b8" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름, 수급번호 검색"
            style={{
              paddingLeft: 24, paddingRight: 8,
              height: 24, width: 160,
              border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 11, outline: 'none',
              background: '#f8fafc', color: '#1e293b',
            }}
          />
        </div>

        {/* 결과 수 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SharedDataBadge title="수급자 기초정보" />
          <span style={{ fontSize: 10, color: '#64748b' }}>
            총 <strong style={{ color: '#1d4ed8' }}>{filtered.length}</strong>명
          </span>
        </div>
      </div>

      {/* ── 테이블 영역 ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', minWidth: 120 }}>수급자명</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' as const }}>등급</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>담당 요양보호사</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>서비스종류</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>인정기간</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'right' as const }}>급여한도</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'right' as const }}>기사용액</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'right' as const }}>잔여액</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', minWidth: 100 }}>사용률</th>
                <th style={{ ...TH, textAlign: 'center' as const }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '28px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((r, idx) => {
                  const remaining = r.monthlyLimit - r.usedAmount;
                  const usageRate = Math.min((r.usedAmount / r.monthlyLimit) * 100, 100);
                  const isLow = remaining < 300000;
                  const workers = r.assignedCareWorkerIds
                    .map(id => careWorkers.find(w => w.id === id)?.name)
                    .filter(Boolean);
                  const bg = idx % 2 === 0 ? '#ffffff' : '#f4f7fb';
                  const td: CSSProperties = {
                    padding: '0 10px', height: 30,
                    borderBottom: '1px solid #e4eaf3',
                    background: bg, color: '#1e293b',
                  };

                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/recipients/${r.id}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => {
                        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                          c => ((c as HTMLElement).style.background = '#eff6ff')
                        );
                      }}
                      onMouseLeave={e => {
                        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                          c => ((c as HTMLElement).style.background = bg)
                        );
                      }}
                    >
                      <td style={{ ...td }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{getCertNo(r)}</div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{
                          background: '#dbeafe', color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                        }}>{getGradeText(r)}</span>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {workers.map((name, i) => (
                            <span key={i} style={{
                              background: '#f8fafc', color: '#475569',
                              border: '1px solid #e2e8f0',
                              fontSize: 11, padding: '1px 5px', borderRadius: 3,
                            }}>{name}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {getServiceTypes(r).map(st => {
                            const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
                              visit_care:    { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe', label: '방문요양' },
                              visit_bath:    { bg: '#d1fae5', color: '#059669', border: '#a7f3d0', label: '방문목욕' },
                              visit_nursing: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: '방문간호' },
                              day_care:      { bg: '#ede9fe', color: '#7c3aed', border: '#c4b5fd', label: '주간보호' },
                              family_care:   { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: '가족요양' },
                            };
                            const c = map[st] ?? { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: st };
                            return (
                              <span key={st} style={{
                                background: c.bg, color: c.color,
                                border: `1px solid ${c.border}`,
                                fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                              }}>{c.label}</span>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{getValidFrom(r)} ~</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{getValidTo(r)}</div>
                      </td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: "'Noto Sans KR', sans-serif" }}>{formatKRW(r.monthlyLimit)}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: "'Noto Sans KR', sans-serif" }}>{formatKRW(r.usedAmount)}</td>
                      <td style={{ ...td, textAlign: 'right', fontFamily: "'Noto Sans KR', sans-serif" }}>
                        <span style={{ color: isLow ? '#dc2626' : '#059669', fontWeight: 600 }}>
                          {formatKRW(remaining)}
                        </span>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ flex: 1, height: 5, background: '#e4eaf3', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 3,
                              background: isLow ? '#dc2626' : '#2563eb',
                              width: `${usageRate}%`,
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                            {usageRate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                          background: r.status === 'active' ? '#f0fdf4' : '#fff1f2',
                          color: r.status === 'active' ? '#059669' : '#dc2626',
                          border: `1px solid ${r.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                        }}>
                          {r.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}