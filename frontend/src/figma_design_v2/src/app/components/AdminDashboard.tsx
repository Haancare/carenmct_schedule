export function AdminDashboard() {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif", background: '#f8f5ff',
    }}>
      <div style={{ textAlign: 'center', color: '#a78bfa' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>준비 중입니다.</div>
        <div style={{ fontSize: 11, color: '#c4b5fd' }}>서비스 준비 중입니다. 잠시 후 다시 확인해 주세요.</div>
      </div>
    </div>
  );
}
