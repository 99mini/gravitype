// 물리·렌더 상수는 전부 여기에 모은다 (PRD §9).
// 튜닝은 이 파일에서 한 줄씩만 고친다.

export const PHYSICS = {
  /** 기본 중력 (matter.js 기본 스케일, y 양수 = 아래) */
  gravityY: 1,
  /** 반발계수 — 글자가 바닥에서 살짝 튀는 정도 */
  restitution: 0.2,
  /** 표면 마찰 */
  friction: 0.3,
  /** 공기 저항 */
  frictionAir: 0.01,
  /** 사각 충돌체 모서리 깎기 반지름(px) */
  chamferRadiusPx: 8,
} as const;

export const RENDER = {
  /** 글자 크기(px, CSS 픽셀 기준) */
  fontSizePx: 56,
  fontFamily:
    "system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
  textColor: "#e8e8ef",
  /** devicePixelRatio 상한 — 3 이상 기기는 발열 때문에 2로 캡 (PRD §6) */
  maxDevicePixelRatio: 2,
} as const;

export const WORLD = {
  /** 바닥·벽 두께(px). 두껍게 해야 빠른 물체가 뚫고 나가지 않는다 */
  wallThicknessPx: 200,
  /** 스폰 위치: 화면 상단 중앙에서 이만큼 위 */
  spawnAboveTopPx: 40,
  /** 스폰 시 좌우 랜덤 흔들림(px) — 같은 자리에 정확히 쌓여 탑이 되는 것 방지 */
  spawnJitterPx: 24,
  /** 물체 수 상한 — 초과 시 가장 오래된 것부터 제거 (PRD §6) */
  maxBodies: 200,
  /** 화면 밖 판정 여유(px) — 이보다 더 내려가면 즉시 제거 */
  cullMarginPx: 300,
} as const;
