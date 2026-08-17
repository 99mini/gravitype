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

export const MASS = {
  /** 잉크 픽셀(불투명 픽셀) 하나당 질량 — 획이 많을수록 무겁다 (PRD §4.2) */
  perInkPixel: 0.003,
  /** 최소 질량 — `.` 같은 글자가 너무 가벼워 날뛰지 않게 */
  min: 0.2,
  /** 잉크 측정 시 불투명으로 인정할 알파 임계값 (0-255) */
  alphaThreshold: 24,
} as const;

export const SHAPES = {
  /** 원형 충돌체 — 굴러간다 */
  circles: "ㅇ0oO○◎●",
  /** 잘 튀는 글자들의 반발계수 — 너무 높으면 끝없이 튄다 */
  bouncyRestitution: 0.45,
  /** 잘 튀는 글자들의 공기 저항 — 회전·이동을 빨리 잦아들게 해 헛돌기 방지 */
  bouncyFrictionAir: 0.04,
  bouncyChars: ".,'`·:;\"",
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
