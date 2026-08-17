// 폰 자체가 컨트롤러 (PRD §4.3).
// - 기울이기: deviceorientation → 중력 벡터가 기울기를 따라간다
// - 흔들기: devicemotion 가속도(중력 제외)가 임계값을 넘으면 전체 임펄스
//
// iOS 13+ 는 사용자 제스처 안에서 requestPermission 을 호출해야 한다.
// 첫 진입이 아니라 글자를 몇 개 쌓은 뒤 힌트 버튼으로 요청하고,
// 거부되어도 나머지 기능은 전부 동작한다 (PRD §4.3).

import { MOTION } from "./constants";

export interface MotionTarget {
  setGravity: (x: number, y: number) => void;
  shake: () => void;
}

interface PermissionRequestable {
  requestPermission?: () => Promise<"granted" | "denied">;
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function startListening(target: MotionTarget) {
  window.addEventListener("deviceorientation", (e) => {
    // 세로(portrait) 기준: gamma = 좌우 기울기, beta = 앞뒤 기울기
    const gx = clamp((e.gamma ?? 0) / MOTION.tiltFullAtDeg);
    const gy = clamp((e.beta ?? 0) / MOTION.tiltFullAtDeg);
    target.setGravity(gx, gy);
  });

  let lastShakeAt = 0;
  window.addEventListener("devicemotion", (e) => {
    const a = e.acceleration;
    if (!a) {
      return;
    }
    const magnitude = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0);
    const now = performance.now();
    if (magnitude >= MOTION.shakeAccelThreshold && now - lastShakeAt >= MOTION.shakeCooldownMs) {
      lastShakeAt = now;
      target.shake();
    }
  });
}

/** 글자가 어느 정도 쌓인 뒤 한 번만 호출한다 */
export function setupMotion(target: MotionTarget, promptButton: HTMLButtonElement | null) {
  if (!("DeviceOrientationEvent" in window)) {
    return; // 센서 없는 환경(데스크톱) — 조용히 무시
  }

  const orientation = DeviceOrientationEvent as unknown as PermissionRequestable;
  if (typeof orientation.requestPermission !== "function") {
    startListening(target); // 안드로이드 등 — 권한 불필요
    return;
  }

  // iOS — 힌트 버튼을 보여주고, 탭(제스처) 안에서 권한을 요청한다
  if (!promptButton) {
    return;
  }
  promptButton.hidden = false;
  promptButton.addEventListener(
    "click",
    async () => {
      promptButton.hidden = true;
      try {
        const motion = DeviceMotionEvent as unknown as PermissionRequestable;
        const granted = await orientation.requestPermission?.();
        await motion.requestPermission?.().catch(() => "denied");
        if (granted === "granted") {
          startListening(target);
        }
      } catch {
        // 거부 — 기울기 없이도 나머지는 전부 동작한다
      }
    },
    { once: true },
  );
}
