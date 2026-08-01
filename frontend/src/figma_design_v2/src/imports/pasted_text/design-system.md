아래 디자인 시스템을 기준으로 개발해줘.
기관명: 즐거운재가센터
기술스택: React + Tailwind CSS + react-router (react-router-dom 사용 금지)
아이콘: lucide-react

━━━━━━━━━━━━━━━━━━━━━━━━━
[1] 컬러 팔레트
━━━━━━━━━━━━━━━━━━━━━━━━━

헤더/네비게이션 (다크 네이비)
  배경 그라디언트 : linear-gradient(90deg, #0f2744 0%, #1a3a5c 100%)
  로고 아이콘 배경: linear-gradient(135deg, #3b82f6, #60a5fa)
  활성 메뉴 배경  : linear-gradient(135deg, #3b82f661, #2563eb47)
  활성 메뉴 테두리: #3b82f666
  비활성 메뉴 색상: #93c5ff8c (blue-200/55)
  구분선          : #ffffff1a
  헤더 높이       : 44px

페이지 배경
  전체 페이지 : #f0f4f8
  흰색 패널   : #ffffff
  서브 패널   : #f8fafc
  서브바 배경 : #ffffff, 높이 26px, 테두리 #e2e8f0

텍스트
  주요 텍스트   : #0f172a, #1e293b
  보조 텍스트   : #64748b
  비활성/힌트   : #94a3b8
  흰색 텍스트   : #ffffffcc

상태 색상
  완료(녹색)   : bg #f0fdf4 / text #059669 / border #a7f3d0
  검토필요(황색): bg #fffbeb / text #d97706 / border #fde68a
  미작성(적색) : bg #fff1f2 / text #dc2626 / border #fecaca
  정보(파랑)   : bg #dbeafe / text #1d4ed8 / border #bfdbfe
  보라(강조)   : bg #ede9fe / text #7c3aed / border #c4b5fd

테이블 헤더
  고정 컬럼 배경  : #152e50 (가장 어두운)
  스크롤 컬럼 배경: #1e3a5f
  헤더 텍스트     : #ffffffe0
  헤더 구분선     : #ffffff1e
  짝수 행 배경    : #f4f7fb
  홀수 행 배경    : #ffffff
  행 하단 구분선  : #e4eaf3

━━━━━━━━━━━━━━━━━━━━━━━━━
[2] 타이포그래피
━━━━━━━━━━━━━━━━━━━━━━━━━

  테이블 전체 폰트   : 11px (통일 필수)
  테이블 헤더 폰트   : 10px, fontWeight 600
  서브 레이블/뱃지   : 9~10px
  섹션 제목          : 11px, fontWeight 700, color #64748b
  페이지 주요 제목   : 12~13px, fontWeight 700
  숫자(금액/시간)    : fontFamily 'monospace'
  헤더 기관명        : 12px fontWeight 700 white
  헤더 시스템명      : 9px color #ffffff66

━━━━━━━━━━━━━━━━━━━━━━━━━
[3] 레이아웃 구조
━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────┐
  │  헤더 (44px) - 다크 네이비       │  ← 로고 | 네비 | 알림·사용자·로그아웃
  ├─────────────────────────────────┤
  │  서브바 (26px) - 흰색 브레드크럼  │  ← 홈 / 현재페이지
  ├─────────────────────────────────┤
  │  콘텐츠 영역 (flex-1, 스크롤)    │  ← 페이지별 내용
  └─────────────────────────────────┘

  전체: display flex, flexDirection column, height 100vh, overflow hidden
  콘텐츠: flex 1, minHeight 0, overflow hidden (테이블 스크롤 대응)

━━━━━━━━━━━━━━━━━━━━━━━━━
[4] 공통 컴포넌트 패턴
━━━━━━━━━━━━━━━━━━━━━━━━━

■ 버튼

  주요(파랑):
    background: linear-gradient(135deg,#2563eb,#1d4ed8)
    color: white, border: none, borderRadius: 7
    padding: 5px 12px, fontSize: 11px, fontWeight: 600

  보조(흰색):
    background: white, color: #374151
    border: 1px solid #e2e8f0, borderRadius: 7
    padding: 5px 12px, fontSize: 11px

  위험(빨강):
    background: #dc2626, color: white
    border: none, borderRadius: 7

  강조(보라):
    background: linear-gradient(135deg,#7c3aed,#6d28d9)
    color: white, border: none, borderRadius: 7

  아이콘+텍스트 버튼: display flex, alignItems center, gap 5

■ 입력 필드
  const inp = (extra?) => ({
    width: '100%', padding: '5px 8px',
    border: '1px solid #e2e8f0', borderRadius: 6,
    fontSize: '11px', outline: 'none',
    background: '#f8fafc', color: '#1e293b',
    ...extra
  })

  const label = () => ({
    display: 'block', fontSize: '10px',
    fontWeight: 600, color: '#64748b',
    marginBottom: 4
  })

■ 필터 바
  배경: white, borderBottom: 1px solid #e2e8f0
  padding: 6px 16px, display flex, alignItems center, gap 8
  Filter 아이콘(12px, #94a3b8) + 버튼 그룹 + 검색창 + 드롭다운

  필터 버튼(비활성): border #e2e8f0, bg white, color #64748b, borderRadius 16
  필터 버튼(활성)  : 상태별 색상 적용, fontWeight 700

  검색창: paddingLeft 22(아이콘 공간), border #e2e8f0, borderRadius 6
          background #f8fafc, width 140px

■ 섹션 카드
  배경: white, borderRadius: 8
  border: 1px solid #e2e8f0
  padding: 12px 16px

■ 뱃지/태그
  fontSize: 8~10px, padding: 1px 4~6px
  borderRadius: 3~4px, fontWeight: 600
  상태별 bg/color/border 조합 사용

■ 구분선
  실선  : borderTop: '1px solid #e2e8f0'
  점선  : borderTop: '1px dashed #e2e8f0'
  수직  : width:1, background:#e2e8f0

■ 모달
  오버레이: position fixed, top/left/right/bottom 0
            background rgba(0,0,0,0.45), zIndex 1000
  패널    : position absolute, top 50%, left 50%
            transform translate(-50%,-50%)
            background white, borderRadius 12
            boxShadow: 0 20px 60px rgba(0,0,0,0.15)
  헤더    : background linear-gradient(135deg,#0f2744,#1a3a5c)
            color white, padding 12px 16px, borderRadius 12px 12px 0 0

■ 탭 (모달 내부)
  컨테이너: display flex, borderBottom 2px solid #e2e8f0
            padding: 0 16px, background #f8fafc
  비활성  : color #94a3b8, borderBottom 2px solid transparent
  활성    : color #1e293b, borderBottom 2px solid #2563eb, fontWeight 700

━━━━━━━━━━━━━━━━━━━━━━━━━
[5] 테이블 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━

  - fontSize 11px 전체 통일
  - 헤더 높이: 34px, 데이터 행 높이: 30px
  - 좌측 고정 컬럼: position sticky + zIndex
  - 컬럼 너비: 상수 W = {} 객체로 선언
  - 누적 left 오프셋: 상수 S = {} 객체로 선언
  - 금액 컬럼: textAlign right, fontFamily monospace
  - 0원/없음: <span style={{color:'#d1d5db'}}>-</span>
  - 짝수/홀수 행 배경 분리 (even: #f4f7fb / odd: #ffffff)
  - 고정 컬럼 배경은 별도 bgFix 변수로 관리

━━━━━━━━━━━━━━━━━━━━━━━━━
[6] 네비게이션
━━━━━━━━━━━━━━━━━━━━━━━━━

  react-router의 NavLink 사용 (react-router-dom 금지)
  메뉴 높이: 28px, borderRadius: 6px(rounded-md)
  아이콘 크기: 13px, 텍스트: 12px
  active: 배경 그라디언트 + 파란 테두리

━━━━━━━━━━━━━━━━━━━━━━━━━
[7] 공통 저장소 (localStorage 기반)
━━━━━━━━━━━━━━━━━━━━━━━━━

  모듈 레벨 싱글턴 패턴 사용
  employeeStore  : 직원 기초정보 (전 시스템 공통)
  recipientStore : 수급자 기초정보 (전 시스템 공통)
  각 시스템 전용 스토어는 별도 파일로 분리