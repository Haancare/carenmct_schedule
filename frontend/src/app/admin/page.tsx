export default function AdminHomePage() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
        background: "#f8f5ff",
      }}
    >
      <div style={{ textAlign: "center", color: "#a78bfa" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          관리자 홈
        </div>
        <div style={{ fontSize: 11, color: "#c4b5fd" }}>
          상단 메뉴에서 기준관리 항목을 선택해 주세요.
        </div>
      </div>
    </div>
  );
}
