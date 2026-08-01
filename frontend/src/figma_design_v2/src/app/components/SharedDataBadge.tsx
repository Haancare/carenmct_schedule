import type { CSSProperties } from 'react';
import { Database } from 'lucide-react';

interface Props {
  /** 호버 시 표시할 보조 설명 */
  title?: string;
  /** 라벨(미지정 시 "외부 공유") */
  label?: string;
  /** 추가 인라인 스타일 */
  style?: CSSProperties;
}

/**
 * 「한케어 업무포털」(시작화면)이 관리하는 기초정보(요양기관/수급자/직원/공통상수)를
 * 본 프로그램에서 조회할 때 함께 표시하는 안내 뱃지.
 * 포털과 본 프로그램은 DB만 공유하며 SSO/세션 공유가 없으므로 외부 링크는 두지 않고, 호버 안내만 제공한다.
 */
export function SharedDataBadge({ title, label = '외부 공유', style }: Props) {
  const tooltip = title
    ? `${title}\n※ 본 데이터는 「한케어 업무포털」에서 관리됩니다 (DB 공유, SSO 미연결)`
    : '본 데이터는 「한케어 업무포털」에서 관리됩니다 (DB 공유, SSO 미연결)';

  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontSize: 10, fontWeight: 600,
        padding: '1px 7px', borderRadius: 10,
        background: '#eef2ff', color: '#4338ca',
        border: '1px solid #c7d2fe',
        cursor: 'help',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <Database size={9} />
      <span>{label}</span>
    </span>
  );
}
