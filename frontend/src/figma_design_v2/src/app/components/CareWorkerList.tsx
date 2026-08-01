import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Search, Filter, Phone, Calendar } from 'lucide-react';
import { careWorkers, recipients, getSchedules, getGradeText } from './mockData';
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

export function CareWorkerList() {
  const navigate = useNavigate();
  const [query, setQuery]           = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const schedules  = getSchedules(2026, 3);
  const todayStr   = '2026-03-21';

  const filtered = careWorkers.filter(w => {
    const q = query.trim();
    const matchQ = q === '' || w.name.includes(q) || w.registrationId.includes(q) || w.phone.includes(q);
    const matchS  = filterStatus === 'all' || w.status === filterStatus;
    return matchQ && matchS;
  });

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

        {/* 재직 상태 필터 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { value: 'all',      label: '전체' },
            { value: 'active',   label: '재직' },
            { value: 'inactive', label: '퇴직' },
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

        {/* 검색 */}
        <div style={{ position: 'relative' }}>
          <Search size={11} color="#94a3b8" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름, 주민번호, 연락처 검색"
            style={{
              paddingLeft: 24, paddingRight: 8,
              height: 24, width: 180,
              border: '1px solid #e2e8f0', borderRadius: 6,
              fontSize: 11, outline: 'none',
              background: '#f8fafc', color: '#1e293b',
            }}
          />
        </div>

        {/* 결과 수 */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SharedDataBadge title="직원(요양보호사) 기초정보" />
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
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', minWidth: 100 }}>요양보호사명</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>자격증</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>연락처</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>입사일</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)' }}>담당 수급자</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' as const }}>오늘</th>
                <th style={{ ...TH, borderRight: '1px solid rgba(255,255,255,0.12)', textAlign: 'center' as const }}>이번달</th>
                <th style={{ ...TH, textAlign: 'center' as const }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '28px', textAlign: 'center', fontSize: 11, color: '#94a3b8' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((w, idx) => {
                  const assignedRecipients = w.assignedRecipientIds
                    .map(rid => recipients.find(r => r.id === rid))
                    .filter(Boolean);
                  const workerSchedules = schedules.filter(s => s.careWorkerId === w.id);
                  const todayCount = workerSchedules.filter(s => s.date === todayStr).length;
                  const monthCount = workerSchedules.length;
                  const bg = idx % 2 === 0 ? '#ffffff' : '#f4f7fb';

                  const td: CSSProperties = {
                    padding: '0 10px', height: 30,
                    borderBottom: '1px solid #e4eaf3',
                    background: bg, color: '#1e293b',
                  };

                  return (
                    <tr
                      key={w.id}
                      style={{ cursor: 'default' }}
                      onMouseEnter={e => {
                        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                          c => ((c as HTMLElement).style.background = '#f0fdf4')
                        );
                      }}
                      onMouseLeave={e => {
                        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                          c => ((c as HTMLElement).style.background = bg)
                        );
                      }}
                    >
                      <td style={{ ...td }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{w.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.registrationId}</div>
                      </td>
                      <td style={{ ...td }}>
                        <span style={{
                          background: '#ede9fe', color: '#7c3aed',
                          border: '1px solid #c4b5fd',
                          fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                        }}>{w.qualification}</span>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={9} color="#94a3b8" />
                          <span style={{ color: '#475569' }}>{w.phone}</span>
                        </div>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={9} color="#94a3b8" />
                          <span style={{ color: '#64748b' }}>{w.joinDate}</span>
                        </div>
                      </td>
                      <td style={{ ...td }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {assignedRecipients.map(r => (
                            <button
                              key={r!.id}
                              onClick={(e) => { e.stopPropagation(); navigate(`/recipients/${r!.id}`); }}
                              style={{
                                background: '#dbeafe', color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {r!.name} ({getGradeText(r!)})
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{
                          background: '#dbeafe', color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}>{todayCount}건</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{
                          background: '#f8fafc', color: '#475569',
                          border: '1px solid #e2e8f0',
                          fontSize: 11, padding: '1px 6px', borderRadius: 3,
                          fontFamily: "'Noto Sans KR', sans-serif",
                        }}>{monthCount}건</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                          background: w.status === 'active' ? '#f0fdf4' : '#fff1f2',
                          color: w.status === 'active' ? '#059669' : '#dc2626',
                          border: `1px solid ${w.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                        }}>
                          {w.status === 'active' ? '재직' : '퇴직'}
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