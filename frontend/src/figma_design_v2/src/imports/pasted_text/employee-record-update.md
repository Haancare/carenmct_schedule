AI
근무급여탭에 재직상태, 입사일, 퇴직일을 구성해줘
완료했습니다. 변경 내용은 다음과 같습니다.

기본 인적사항 탭: 재직상태, 퇴직일 항목 제거 → 성명·별칭·생년월일·주민등록번호·휴대폰 5개만 남음
근무·급여 탭: 직종/급여유형 아래에 재직상태 · 입사일 · 퇴직일 3열 그리드를 연회색 박스로 묶어 배치 — 연관된 세 항목이 한눈에 보이도록 시각적으로 그룹화했습니다
입사하고 퇴직하고, 재입사하고 퇴직하고, 재입사하고 근무중. 또는 퇴직했을 수도 있어. 이렇게 기간별로 관리할 수 있게 구성해줘
이제 모달의 상태 관리와 work 탭을 기간 관리 방식으로 전면 교체합니다.

Now I have the exact content. I'll use edit_tool to make precise replacements.

완료했습니다. 구현 내용을 정리합니다.

데이터 구조: EmploymentPeriod { joinDate, retireDate? } 타입 추가, EmployeeRecord에 employmentPeriods?: EmploymentPeriod[] 필드 추가. 기존 단일 joinDate/retireDate 데이터도 자동 호환됩니다.

근무·급여 탭 — 재직 이력 섹션:

기간 추가 버튼으로 재직 기간을 무한히 추가
각 행에 입사일·퇴직일 입력, 퇴직일 비워두면 자동으로 재직중 상태 표시
2개 이상일 때 삭제 버튼 활성화
헤더에 현재 상태(재직/퇴직) 뱃지 + N회 재직 뱃지 실시간 표시
하단에 최초 입사일 / 최종 퇴직일 요약
직원 목록 테이블: 입사일 컬럼에 재직이력 2건 이상이면 N회 황색 뱃지 표시, 상태·퇴직일은 가장 최신 기간 기준으로 표시

근무급여탭의 명칭을 근무로 하고, 밑에 급여계좌부분은 기본 인적사항으로 이동해줘
완료했습니다.

탭 레이블: 근무 · 급여 → 근무
급여·계좌(은행명·계좌번호): 근무 탭에서 제거 → 기본 인적사항 탭 하단에 구분선과 함께 배치 (전체 너비 2열 그리드)
이 부분에 대한 기능 제거해줘.
선택된 버튼은 제거했습니다.

완전한 기능 제거를 위해서는 선택 영역 밖의 코드도 정리가 필요합니다. 아래 항목들이 남아 있는데, 함께 제거할까요?

신규 직원 입력 폼 — 버튼 아래에 펼쳐지던 이름·직종·유형·시간 입력 영역
신규 직원 행 — 테이블 상단에 표시되던 "N1, N2…" 형태의 신규 직원 행
관련 상태 변수 및 함수 — showNewEmpForm, newEmpForm, handleSaveNewEmp 등 내부 로직
UserPlus 아이콘 import — 버튼 제거로 더 이상 사용되지 않는 아이콘
나는 수급자와 요양보호사의 서비스일정을 관리하는 시스템, 지금 만들고 있는 급여관리시스템, 또다른 재무회계시스템, 직원교육관리시스템을 만들거야. 그런데 수급자와 직원이 공통 기초정보로 쓰여야 해. 여기 파일에 다른 시스템도 별도로 만들어갈 수 있어? 어떻게 하면 좋을까?
좋은 질문입니다. 구조적으로 정리해드릴게요.

같은 프로젝트에서 모두 만들 수 있습니다
현재 React Router + localStorage 싱글턴 스토어 구조가 이미 이 방향에 최적화되어 있어요.

추천 구조
src/
├── app/
│   ├── store/
│   │   ├── employeeStore.ts        ← 공통 (직원)
│   │   ├── recipientStore.ts       ← 공통 (수급자) ← 신규 추가
│   │   ├── payrollStore.ts         ← 급여관리 전용
│   │   ├── scheduleStore.ts        ← 일정관리 전용
│   │   ├── financeStore.ts         ← 재무회계 전용
│   │   └── trainingStore.ts        ← 교육관리 전용
│   │
│   ├── pages/
│   │   ├── Home.tsx                ← 시스템 선택 포털 (메인)
│   │   │
│   │   ├── payroll/                ← 급여관리 (현재 작업 중)
│   │   ├── schedule/               ← 서비스일정 관리
│   │   ├── finance/                ← 재무회계
│   │   └── training/               ← 직원교육
│   │
│   └── routes.tsx
핵심 원칙
항목	방식
공통 기초정보	employeeStore, recipientStore → 모든 시스템이 동일 스토어 참조
시스템 간 이동	React Router로 /payroll, /schedule, /finance, /training 분기
데이터 격리	각 시스템 전용 스토어는 별도로 분리
포털 홈	/ 경로에 4개 시스템 진입 카드 UI
왜 하나의 프로젝트가 유리한가?
직원 정보 수정 → 급여·일정·교육 모두에 즉시 반영
수급자 정보 수정 → 일정·급여(수가) 모두에 즉시 반영
localStorage 키만 통일하면 별도 API 없이 공유 가능
나중에 Supabase 연동 시 스토어만 교체하면 전체 적용
바로 시작할 수 있는 것들:

recipientStore.ts 생성 (수급자 기초정보 공통 스토어)
포털 홈 화면 (/) 제작 — 4개 시스템 진입 카드
서비스일정 관리 시스템 골격 구성 (/schedule)
어느 부분부터 진행할까요?

지금 이 프로젝트 안에 4개의 파일이 있어. 그 중 1개의 파일이 지금 급여관리시스템이야. 여기 창에서 나머지도 다 만들면 돼?
네, 이 프로젝트 안에서 모두 만들 수 있습니다. 다만 알아두실 점이 있어요.

현재 구조 파악
지금 이 프로젝트는 이미 급여관리시스템 전체가 하나의 React 앱으로 구성되어 있어요.

현재 라우터 구조 (모두 급여관리)
/               → 대시보드
/employees      → 직원관리
/payroll        → 급여대장
/create         → 급여작성
/insurance      → 4대보험
/labor          → 노무관리
같은 프로젝트에 추가하는 방법
라우터에 시스템별 경로를 추가하면 됩니다.

추가 예시
/schedule/*     → 서비스일정 관리시스템
/finance/*      → 재무회계시스템  
/training/*     → 직원교육관리시스템
employeeStore와 신규 생성할 recipientStore를 4개 시스템이 공유하면 됩니다.

현실적인 고려사항
항목	내용
✅ 기술적으로 가능	React Router로 시스템 분기, 스토어 공유
✅ 데이터 공유	직원·수급자 정보 한 번만 입력, 전 시스템 사용
⚠️ 파일 크기	시스템이 늘수록 코드가 커짐 (현재도 이미 큰 편)
⚠️ Figma Make 환경	파일이 너무 커지면 편집 속도가 느려질 수 있음
추천 방식
지금 이 프로젝트를 "즐거운재가센터 통합 플랫폼"으로 확장하되,
상단 Layout에 시스템 전환 탭/버튼을 추가해서 각 시스템으로 이동하는 구조로 가세요.

나중에 규모가 커지면 Supabase를 공통 백엔드로 연결하면 시스템 간 데이터가 실시간으로 동기화됩니다.

바로 시작하려면 — 어떤 시스템을 다음으로 만들까요?

지금보다 10배 이상 크기가 커질거야. 계속 여기서 만들어도 될까?
솔직하게 말씀드릴게요.

Figma Make의 현실적 한계
항목	현재	10배 후
파일 크기	이미 일부 파일이 편집 한계 근처	편집 속도 저하, 오류 가능성 ↑
AI 편집 정확도	양호	파일이 클수록 수정 실수 증가
파일 읽기	30KB 초과 시 요약/잘림 발생	빈번하게 발생
복잡한 리팩토링	가능	점점 어려워짐
결론: 10배 규모의 실무 시스템을 Figma Make 안에서만 완성하는 건 권장하지 않습니다.

현실적인 추천 워크플로우
Figma Make                    실제 개발 환경 (VS Code + Git)
─────────────────             ──────────────────────────────
✅ 화면 설계                  ✅ 실제 운영 코드 작성
✅ 기능 프로토타입             ✅ 대용량 파일 관리
✅ 빠른 UI 시안               ✅ 팀 협업 / 버전 관리
✅ 아이디어 검증              ✅ 배포 (Vercel, Netlify 등)
Figma Make에서 만든 코드를 그대로 VS Code로 옮겨서 계속 개발할 수 있어요.
React + Tailwind 표준 코드라 이식에 문제 없습니다.

지금 당장 어떻게 하면 좋을까
1단계 (지금 · Figma Make)
   └─ 급여관리시스템 완성 + 공통 스토어 구조 확립
   └─ 나머지 3개 시스템 핵심 화면 프로토타입

2단계 (이후 · VS Code + Git)
   └─ 전체 코드 export → 로컬 프로젝트로 이전
   └─ 시스템별 실제 기능 구현 + Supabase 연결
   └─ 운영 배포
지금 급여관리시스템을 먼저 완성하는 데 집중하시는 걸 추천드립니다.
완성 후 코드를 VS Code로 가져가서 나머지 시스템을 이어 개발하는 게 가장 현실적인 경로예요. 계속 진행할까요?

지금 피그마에 송준호프로젝트 안에 4개의 파일이 있고, 그 중 하나가 이 파일의 급여관리시스템이야. 다른 파일을 참고해서 만들게 할 수 있어?
아쉽게도 직접 참조는 안 됩니다. 이유를 설명드릴게요.

Figma Make의 파일 범위
송준호프로젝트
├── 📄 급여관리시스템  ← 지금 이 창 (AI가 볼 수 있는 범위)
├── 📄 다른 파일 A    ← AI가 볼 수 없음
├── 📄 다른 파일 B    ← AI가 볼 수 없음
└── 📄 다른 파일 C    ← AI가 볼 수 없음
Figma Make의 AI는 현재 열려 있는 파일 하나의 코드만 읽고 수정할 수 있어요.
다른 파일 은 별도의 독립적인 프로젝트로 동작합니다.

다른 파일을 참고시키는 방법
방법 1 — 프레임 가져오기 (가장 간단)

다른 Figma 파일의 프레임을 이 파일로 복사해서 붙여넣기
→ Figma Make에서 "가져오기"로 디자인 코 드 변환 가능

방법 2 — 직접 내용 전달

다른 파일의 화 면을 캡처하거나, 필요한 내용을 채팅으로 설명해주시면
제가 참고해서 만 들 수 있어요

방법 3 — 각 파일에서 별도로 개발

각 Figma 파일마다 Figma Make를 열어서 시스 템별로 개발
→ 나중에 VS Code에서 하 나의 프로젝트로 합치기

현실적으로 가장 좋은 방법
지금 다른 파일에 디자인(화면 시안) 이 있으신가요,
아니면 기획 내용(기능 설명) 이 있으신가요?

그에 따라 가장 효율적인 방법을 안내드릴 수 있어요.

다른 프로젝트에 이 시스템과 같은 디자인시스템을 유지하고 싶은데, 전달할 내용을 작성해줘
현재 프로젝트의 디자인 시스템을 분석하겠습니다.

분석 완료했습니다. 다른 Figma Make 프로젝트에 붙여넣을 수 있는 전달용 문서를 작성해드릴게요.

즐거운재가센터 통합 디자인 시스템 명세서
이 내용을 새 Figma Make 프로젝트의 첫 번째 채팅 메시지로 그대로 붙여넣으세요.

📋 새 프로젝트 시작 시 전달 프롬프트
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

━━━━━━━━━━━━━━━━━━━━━━━━━
[8] 제거된 개념 (사용 금지)
━━━━━━━━━━━━━━━━━━━━━━━━━

  - department(부서) 개념 없음
  - payrollStatus 구분값 없음
  - EmployeeType 구분 없음
  - rank(직급) 필드 없음
  - empNumber(사번) 필드 없음
  - 저장취소 기능 없음
이 내용을 새 Figma Make 프로젝트를 시작할 때 첫 메시지로 붙여넣으면 동일한 디자인 언어로 개발이 시작됩니다. 필요하면 시스템별로 특화된 내용(수급자 필드 구조, 일정 데이터 타입 등)을 추가해드릴 수 있어요.

연월 선택하는 부분을 다른 프로젝트에 동일하게 구현되게 알려주고 싶은데, 머라고 해?
현재 연월 선택 컴포넌트를 먼저 찾아볼게요.

코드를 정확히 분석했습니다. 아래 내용을 채팅에 그대로 붙여넣으세요.

📋 연월 선택 바 — 전달 프롬프트
연월 선택 바를 아래 스펙 그대로 구현해줘.

━━━━━━━━━━━━━━━━━━━━━━━━━
[구조]  흰색 바 (height: 40px, borderBottom: '1px solid #dde3ec')
        shrink-0 flex items-center gap-0 px-4 bg-white

[상태]  const [selYear,  setSelYear]  = useState(2026);
        const [selMonth, setSelMonth] = useState(현재월);

━━━━━━━━━━━━━━━━━━━━━━━━━
[연도 선택]

  ← 버튼 (ChevronLeft size=14)
    width:26, height:26, border:none, background:transparent,
    color:'#64748b', cursor:pointer, borderRadius:4
    hover: bg-slate-100

  연도 텍스트
    fontSize:'13px', fontWeight:700, color:'#0f172a',
    minWidth:54, textAlign:'center'

  → 버튼 (ChevronRight size=14) — 동일 스타일

  [연도↔월 구분선]
    width:1, height:18, background:'#cbd5e1', margin:'0 10px'

━━━━━━━━━━━━━━━━━━━━━━━━━
[월 선택]  1~12월 버튼 가로 나열, gap:4(1rem)

  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
    const isActive = m === selMonth;
    return (
      <button key={m} onClick={() => setSelMonth(m)}
        style={{
          height: 27,
          minWidth: 36,
          padding: '0 6px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: isActive ? 700 : 400,
          color: isActive ? '#ffffff' : '#475569',
          background: isActive
            ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
            : '#f1f5f9',
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: isActive ? '#1d4ed8' : '#e2e8f0',
          transition: 'all 0.12s',
        }}
      >
        {m}월
      </button>
    );
  })}

━━━━━━━━━━━━━━━━━━━━━━━━━
[기간 레이블 (선택적)]
  const periodLabel = `${selYear}년 ${selMonth}월`;
  → 헤더 제목, 내보내기 파일명 등에 활용

[연월 바 우측 공간]
  → 페이지별로 KPI 요약 숫자, 검색창, 필터, 버튼 등을 추가 배치
이 내용으로 어느 페이지에서든 동일한 외형의 연월 선택 바가 만들어집니다.

이 부분을 다른 시스템에 동일한 방식으로 붙이려고 해. 어떻게 전달해야 하는지 작성해줘
모든 코드를 파악했습니다. 다른 프로젝트 채팅에 그대로 붙여넣을 전달 프롬프트를 작성해드릴게요.

📋 직원 메모 슬라이드 패널 — 전달 프롬프트
직원별 메모 슬라이드 패널을 아래 스펙 그대로 구현해줘.
아이콘은 lucide-react 사용. (StickyNote, Pin, PinOff, Plus, X, Clock 아이콘 필요)

━━━━━━━━━━━━━━━━━━━━━━━━━
[1] 타입 정의
━━━━━━━━━━━━━━━━━━━━━━━━━

interface MemoEntry {
  id: string;
  content: string;
  timestamp: string;     // ISO string
  payrollMonth?: string; // 예: '2026-03' — 현재 작업 중인 연월 자동 태깅
  pinned: boolean;
}

━━━━━━━━━━━━━━━━━━━━━━━━━
[2] 상태 (useState)
━━━━━━━━━━━━━━━━━━━━━━━━━

const [memoOpen,       setMemoOpen]       = useState(false);
const [memoMap,        setMemoMap]        = useState<Record<string, MemoEntry[]>>({});
const [newMemoText,    setNewMemoText]    = useState('');
const [editingMemoId,  setEditingMemoId]  = useState<string | null>(null);
const [editingMemoText,setEditingMemoText]= useState('');

// 현재 선택된 대상(직원/수급자 등)의 메모 목록
const empMemos: MemoEntry[] = selectedTarget
  ? (memoMap[selectedTarget.id] ?? []) : [];
const pinnedMemos = empMemos.filter(m => m.pinned);
const normalMemos = empMemos.filter(m => !m.pinned);
const sortedMemos = [...pinnedMemos, ...normalMemos]; // 고정 메모 항상 위

━━━━━━━━━━━━━━━━━━━━━━━━━
[3] 핸들러 함수
━━━━━━━━━━━━━━━━━━━━━━━━━

function addMemo() {
  if (!newMemoText.trim() || !selectedTarget) return;
  const entry: MemoEntry = {
    id: `memo-${Date.now()}`,
    content: newMemoText.trim(),
    timestamp: new Date().toISOString(),
    payrollMonth: `${selYear}-${String(selMonth).padStart(2,'0')}`, // 현재 연월 태깅
    pinned: false,
  };
  setMemoMap(prev => ({
    ...prev,
    [selectedTarget.id]: [entry, ...(prev[selectedTarget.id] ?? [])],
  }));
  setNewMemoText('');
}

function togglePinMemo(memoId: string) {
  if (!selectedTarget) return;
  setMemoMap(prev => ({
    ...prev,
    [selectedTarget.id]: (prev[selectedTarget.id] ?? [])
      .map(m => m.id === memoId ? { ...m, pinned: !m.pinned } : m),
  }));
}

function deleteMemo(memoId: string) {
  if (!selectedTarget) return;
  setMemoMap(prev => ({
    ...prev,
    [selectedTarget.id]: (prev[selectedTarget.id] ?? [])
      .filter(m => m.id !== memoId),
  }));
}

function saveEditMemo() {
  if (!selectedTarget || !editingMemoId || !editingMemoText.trim()) {
    setEditingMemoId(null); return;
  }
  setMemoMap(prev => ({
    ...prev,
    [selectedTarget.id]: (prev[selectedTarget.id] ?? [])
      .map(m => m.id === editingMemoId
        ? { ...m, content: editingMemoText.trim() } : m),
  }));
  setEditingMemoId(null);
  setEditingMemoText('');
}

function formatMemoTime(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

━━━━━━━━━━━━━━━━━━━━━━━━━
[4] 메모 열기 버튼 (상단 툴바에 배치)
━━━━━━━━━━━━━━━━━━━━━━━━━

<button
  onClick={() => setMemoOpen(v => !v)}
  style={{
    display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
    background: memoOpen || empMemos.length > 0 ? '#fefce8' : 'white',
    border: `1px solid ${memoOpen ? '#fbbf24' : empMemos.length > 0 ? '#fde68a' : '#e2e8f0'}`,
    borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
  }}
>
  <StickyNote size={13}
    style={{ color: memoOpen ? '#d97706' : empMemos.length > 0 ? '#f59e0b' : '#94a3b8' }} />
  <span style={{ fontSize: '10px', fontWeight: 600,
    color: memoOpen || empMemos.length > 0 ? '#92400e' : '#94a3b8' }}>메모</span>
  {empMemos.length > 0 && (
    <span style={{
      minWidth: 16, height: 16, borderRadius: 8,
      background: '#f59e0b', color: 'white',
      fontSize: '9px', fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
    }}>
      {empMemos.length}
    </span>
  )}
</button>

━━━━━━━━━━━━━━━━━━━━━━━━━
[5] 슬라이드 패널 (페이지 최상위 div에 position:relative 필요)
━━━━━━━━━━━━━━━━━━━━━━━━━

<div style={{
  position: 'absolute', top: 0, right: 0, bottom: 0, width: 288,
  transform: memoOpen ? 'translateX(0)' : 'translateX(100%)',
  transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
  background: 'white',
  borderLeft: '1px solid #fde68a',
  boxShadow: memoOpen ? '-6px 0 24px #0000001a' : 'none',
  display: 'flex', flexDirection: 'column',
  zIndex: 50,
}}>

  {/* ① 패널 헤더 — 다크 앰버 그라디언트 */}
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 10px',
    background: 'linear-gradient(135deg,#78350f,#92400e)',
    flexShrink: 0,
  }}>
    <StickyNote size={13} style={{ color: '#fde68a' }} />
    <span style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: '#fef9c3' }}>
      {selectedTarget?.name} 메모
    </span>
    {empMemos.length > 0 && (
      <span style={{
        fontSize: '10px', color: '#fde68a',
        background: '#fde68a26', border: '1px solid #fde68a4d',
        padding: '1px 7px', borderRadius: 10, fontWeight: 600,
      }}>
        {empMemos.length}건
      </span>
    )}
    <button onClick={() => setMemoOpen(false)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 20, height: 20, border: 'none',
      background: '#ffffff26', borderRadius: 4, cursor: 'pointer', padding: 0,
    }}>
      <X size={12} style={{ color: 'white' }} />
    </button>
  </div>

  {/* ② 새 메모 입력 영역 — 연한 노란 배경 */}
  <div style={{
    padding: '8px 10px', background: '#fffbeb',
    borderBottom: '1px solid #fde68a', flexShrink: 0,
  }}>
    {/* 현재 작업 중인 귀속연월 표시 */}
    <div style={{
      fontSize: '9px', color: '#92400e', fontWeight: 600,
      marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <Clock size={9} style={{ color: '#d97706' }} />
      {selYear}년 {selMonth}월 귀속 작업 중
    </div>
    <textarea
      value={newMemoText}
      onChange={e => setNewMemoText(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addMemo(); }}
      placeholder={"메모를 입력하세요\n(Ctrl+Enter로 저장)"}
      rows={3}
      style={{
        width: '100%', padding: '5px 7px',
        border: '1px solid #fcd34d', borderRadius: 5,
        fontSize: '11px', color: '#1e293b',
        background: 'white', outline: 'none',
        resize: 'none', boxSizing: 'border-box',
        lineHeight: 1.5, fontFamily: 'inherit',
      }}
    />
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
      <button
        onClick={addMemo}
        disabled={!newMemoText.trim()}
        style={{
          display: 'flex', alignItems: 'center', gap: 3, padding: '4px 12px',
          background: newMemoText.trim()
            ? 'linear-gradient(135deg,#d97706,#b45309)' : '#f1f5f9',
          color: newMemoText.trim() ? 'white' : '#94a3b8',
          border: 'none', borderRadius: 5,
          cursor: newMemoText.trim() ? 'pointer' : 'default',
          fontSize: '11px', fontWeight: 600,
        }}
      >
        <Plus size={11} />저장
      </button>
    </div>
  </div>

  {/* ③ 메모 목록 */}
  <div style={{
    flex: 1, overflowY: 'auto', padding: '6px 8px',
    display: 'flex', flexDirection: 'column', gap: 6,
  }}>
    {sortedMemos.length === 0 ? (
      // 빈 상태
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 8, opacity: 0.5,
      }}>
        <StickyNote size={28} style={{ color: '#d1d5db' }} />
        <p style={{ fontSize: '11px', color: '#9ca3af' }}>메모가 없습니다</p>
      </div>
    ) : (
      sortedMemos.map(memo => (
        <div key={memo.id} style={{
          background: memo.pinned ? '#fffbeb' : '#f8fafc',
          border: `1px solid ${memo.pinned ? '#fde68a' : '#e2e8f0'}`,
          borderLeft: `3px solid ${memo.pinned ? '#f59e0b' : '#e2e8f0'}`,
          borderRadius: 6, padding: '6px 8px',
        }}>
          {/* 메모 메타 행 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {memo.payrollMonth && (
              <span style={{
                fontSize: '9px', background: '#dbeafe', color: '#1d4ed8',
                padding: '0 5px', borderRadius: 8, fontWeight: 600, flexShrink: 0,
              }}>
                {memo.payrollMonth}
              </span>
            )}
            {memo.pinned && (
              <span style={{
                fontSize: '9px', background: '#fef3c7', color: '#d97706',
                padding: '0 5px', borderRadius: 8, fontWeight: 700, flexShrink: 0,
              }}>
                📌 고정
              </span>
            )}
            <span style={{ flex: 1, fontSize: '9px', color: '#94a3b8', textAlign: 'right' }}>
              {formatMemoTime(memo.timestamp)}
            </span>
          </div>

          {/* 내용 — 편집 모드 / 읽기 모드 */}
          {editingMemoId === memo.id ? (
            <div>
              <textarea
                autoFocus
                value={editingMemoText}
                onChange={e => setEditingMemoText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveEditMemo();
                  if (e.key === 'Escape') setEditingMemoId(null);
                }}
                rows={3}
                style={{
                  width: '100%', padding: '4px 6px',
                  border: '1px solid #fbbf24', borderRadius: 4,
                  fontSize: '11px', color: '#1e293b', outline: 'none',
                  resize: 'none', boxSizing: 'border-box',
                  lineHeight: 1.5, fontFamily: 'inherit', background: '#fffbeb',
                }}
              />
              <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditingMemoId(null)} style={{
                  padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: 4,
                  background: 'white', fontSize: '10px', cursor: 'pointer', color: '#64748b',
                }}>취소</button>
                <button onClick={saveEditMemo} style={{
                  padding: '2px 8px', border: 'none', borderRadius: 4,
                  background: '#d97706', color: 'white',
                  fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                }}>저장</button>
              </div>
            </div>
          ) : (
            <p
              onDoubleClick={() => { setEditingMemoId(memo.id); setEditingMemoText(memo.content); }}
              title="더블클릭하여 편집"
              style={{
                fontSize: '11px', color: '#1e293b',
                lineHeight: 1.6, margin: 0,
                whiteSpace: 'pre-wrap', cursor: 'text',
              }}
            >
              {memo.content}
            </p>
          )}

          {/* 액션 버튼 행 */}
          {editingMemoId !== memo.id && (
            <div style={{ display: 'flex', gap: 3, marginTop: 5, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setEditingMemoId(memo.id); setEditingMemoText(memo.content); }}
                style={{ fontSize: '9px', color: '#64748b', background: 'white',
                  border: '1px solid #e2e8f0', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>
                편집
              </button>
              <button
                onClick={() => togglePinMemo(memo.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  fontSize: '9px',
                  color: memo.pinned ? '#d97706' : '#64748b',
                  background: memo.pinned ? '#fef3c7' : 'white',
                  border: `1px solid ${memo.pinned ? '#fde68a' : '#e2e8f0'}`,
                  borderRadius: 3, padding: '1px 6px', cursor: 'pointer',
                }}>
                {memo.pinned ? <PinOff size={9} /> : <Pin size={9} />}
                {memo.pinned ? '고정해제' : '고정'}
              </button>
              <button
                onClick={() => deleteMemo(memo.id)}
                style={{ fontSize: '9px', color: '#dc2626', background: '#fff1f2',
                  border: '1px solid #fecaca', borderRadius: 3, padding: '1px 6px', cursor: 'pointer' }}>
                삭제
              </button>
            </div>
          )}
        </div>
      ))
    )}
  </div>

  {/* ④ 패널 하단 안내 */}
  <div style={{
    padding: '5px 10px', background: '#fffbeb',
    borderTop: '1px solid #fde68a', flexShrink: 0,
  }}>
    <p style={{ fontSize: '9px', color: '#92400e', lineHeight: 1.5 }}>
      💡 더블클릭으로 편집 · 📌 핀으로 중요 메모 고정 · Ctrl+Enter로 빠른 저장
    </p>
  </div>

</div>

━━━━━━━━━━━━━━━━━━━━━━━━━
[6] 컬러 요약
━━━━━━━━━━━━━━━━━━━━━━━━━

패널 헤더 배경  : linear-gradient(135deg, #78350f, #92400e)  ← 다크 앰버
헤더 텍스트     : #fef9c3 (연한 노란 크림)
헤더 아이콘     : #fde68a
입력 영역 배경  : #fffbeb  /  테두리: #fde68a
textarea 테두리 : #fcd34d
저장 버튼(활성) : linear-gradient(135deg, #d97706, #b45309)
고정 메모 카드  : bg #fffbeb / border #fde68a / 좌측선 #f59e0b
일반 메모 카드  : bg #f8fafc / border #e2e8f0 / 좌측선 #e2e8f0
귀속연월 뱃지   : bg #dbeafe / color #1d4ed8
고정 뱃지       : bg #fef3c7 / color #d97706
삭제 버튼       : color #dc2626 / bg #fff1f2 / border #fecaca
하단 안내 바    : bg #fffbeb / border-top #fde68a / text #92400e

━━━━━━━━━━━━━━━━━━━━━━━━━
[7] 동작 규칙
━━━━━━━━━━━━━━━━━━━━━━━━━

- 패널은 우측에서 슬라이드 인/아웃 (translateX 0 ↔ 100%)
- 슬라이드 애니메이션: cubic-bezier(0.4,0,0.2,1) 0.25s
- 패널을 감싸는 부모 div는 반드시 position:relative
- 고정 메모는 항상 목록 최상단 표시
- 메모 작성 시 현재 귀속 연월(selYear-selMonth) 자동 태깅
- Ctrl+Enter → 즉시 저장, Escape → 편집 취소
- 더블클릭 → 인라인 편집 모드 전환
- 메모가 1건 이상이면 열기 버튼이 노란색으로 하이라이트
- 건수 뱃지(주황 원형)가 버튼 우측에 표시됨
- memoMap은 대상 id를 키로 하는 Record 구조 (직원·수급자 등 범용)
create
