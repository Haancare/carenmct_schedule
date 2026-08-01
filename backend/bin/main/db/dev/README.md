# 로컬 DB 초기화 (Phase 0)

## 역할 구분

| 파일 | DB | 하는 일 |
|------|-----|---------|
| `carenmct_com.sql` | `carenmct_com` | **SSOT 참조** (Entity·칼럼 정의). 로컬 com DB는 업무포털 Hibernate가 관리 |
| `carenmct_schedule.sql` | `carenmct_schedule` | **스키마(DDL)** — `sch_*`, com cross-schema FK |
| `migrations/V001_*.sql` | `carenmct_schedule` | **스키마 패치** — 기존 DB 컬럼·인덱스 보완 (initLocalDb 가 DDL 직후 실행) |
| `dev/carenmct_com_dev_contact_seed.sql` | `carenmct_com` | **데이터** — 수급자·직원 `mobile`, 보호자 (`relation_direct=dev_seed`) |
| `dev/carenmct_schedule_dev_seed.sql` | `carenmct_schedule` | **데이터** — `sch_service_schedules` (`source=dev_seed`) |
| `dev/carenmct_schedule_dev_reference_seed.sql` | `carenmct_schedule` | **데이터** — `sch_annual_benefit_limits`, `sch_annual_fee_rate_*` (`note=dev_seed`) |

## 실행

```powershell
cd backend
./gradlew initLocalDb
```

순서: com 연락처 dev seed → `carenmct_schedule` DB 생성 → schedule DDL → sch dev seed → 기준(한도·수가) dev seed

**사전 조건**: `carenmct_com` DB 와 `facilities`·`recipients`·`employees`·`recipient_assigned_workers` 가 업무포털에서 이미 있어야 합니다.

## Collation (MariaDB 11)

로컬 com DB는 보통 `utf8mb4_uca1400_ai_ci`(포털/Hibernate). schedule DDL도 동일 collation을 사용해야 cross-schema FK가 성립합니다.

## 진단

```powershell
./gradlew diagnoseDb
```

## 개발 JWT

```powershell
./gradlew generateDevJwt
```

JWT `facilityId`는 com `users.facility_id` 와 일치해야 합니다.
