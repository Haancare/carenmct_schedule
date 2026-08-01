import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Shield, Bell, LogOut, ChevronRight, Home,
  ArrowLeft, BookOpen, LayoutDashboard, CalendarDays, DollarSign,
} from 'lucide-react';

const navItems = [
  { to: '/admin',                        icon: LayoutDashboard, label: '관리 홈',       end: true },
  { to: '/admin/annual-benefit-limit',   icon: CalendarDays,    label: '연도별급여한도', end: false },
  { to: '/admin/annual-fee-rate',        icon: DollarSign,      label: '연도별수가',     end: false },
  { to: '/admin/naming-guide',           icon: BookOpen,        label: '네이밍가이드',   end: false },
];

function getBreadcrumbs(pathname: string): string[] {
  if (pathname === '/admin' || pathname === '/admin/') return ['관리 홈'];
  if (pathname.startsWith('/admin/annual-benefit-limit')) return ['기준관리', '연도별급여한도'];
  if (pathname.startsWith('/admin/annual-fee-rate'))      return ['기준관리', '연도별수가'];
  if (pathname.startsWith('/admin/naming-guide'))         return ['개발관리', '네이밍가이드'];
  return ['관리 홈'];
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = getBreadcrumbs(location.pathname);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>

      {/* ── 헤더 (44px) — 보라 계열로 요양기관 시스템과 명확히 구분 ── */}
      <header style={{
        height: 44, flexShrink: 0,
        background: 'linear-gradient(90deg, #1e0a3c 0%, #2d1566 100%)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: 16, gap: 0,
        boxShadow: '0 1px 0 rgba(139,92,246,0.3)',
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={13} color="white" />
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>한케어 관리자시스템</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>HanCare Admin</div>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', marginRight: 12 }} />

        {/* 네비게이션 */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 5,
                height: 28, paddingLeft: 10, paddingRight: 10,
                borderRadius: 6, fontSize: 12, textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(109,40,217,0.3))'
                  : 'transparent',
                border: isActive
                  ? '1px solid rgba(139,92,246,0.45)'
                  : '1px solid transparent',
                color: isActive ? '#ffffff' : 'rgba(196,181,253,0.6)',
              })}
            >
              <Icon size={13} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 우측 — 요양기관 시스템으로 돌아가기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              height: 22, paddingLeft: 8, paddingRight: 8,
              borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.3)',
              color: 'rgba(147,197,253,0.85)', fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            <ArrowLeft size={10} />
            <span>급여제공관리로</span>
          </button>
          <Bell size={14} color="rgba(255,255,255,0.45)" style={{ cursor: 'pointer' }} />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: 'white', fontWeight: 700,
            }}>관</div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>관리자</span>
          </div>
          <LogOut size={13} color="rgba(255,255,255,0.35)" style={{ cursor: 'pointer' }} />
        </div>
      </header>

      {/* ── 서브바 (26px) ── */}
      <div style={{
        height: 26, flexShrink: 0,
        background: '#faf7ff',
        borderBottom: '1px solid #e9d5ff',
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: 16, gap: 4,
      }}>
        <Home size={10} color="#a78bfa" />
        <ChevronRight size={10} color="#a78bfa" />
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <ChevronRight size={9} color="#c4b5fd" />}
            <span style={{
              fontSize: 10,
              color: i === crumbs.length - 1 ? '#4c1d95' : '#7c3aed',
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
            }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <main style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: '#f8f5ff' }}>
        <Outlet />
      </main>
    </div>
  );
}
