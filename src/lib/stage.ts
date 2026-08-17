// 물리 월드 + 캔버스 렌더 루프.
// matter.js 기본 렌더러 대신 캔버스에 글자를 직접 그린다 (PRD §6).
import Matter, { type IChamferableBodyDefinition } from "matter-js";

import { MASS, MOTION, PHYSICS, RENDER, SHAPES, WORLD } from "./constants";

const { Bodies, Body, Composite, Engine } = Matter;

interface LetterBody {
  body: Matter.Body;
  char: string;
  /** 렌더·충돌체 크기 (CSS px) */
  width: number;
  height: number;
}

export interface StageOptions {
  /** 첫 물체가 생성될 때 한 번 호출 (첫 진입 힌트 제거용) */
  onFirstSpawn?: () => void;
}

export interface Stage {
  /** 글자 하나를 화면 상단 중앙에서 떨어뜨린다 */
  spawnLetter: (char: string) => void;
  /** 중력 벡터를 바꾼다 (기울기 컨트롤, 각 성분 -1~1) */
  setGravity: (x: number, y: number) => void;
  /** 전체 물체에 랜덤 임펄스 (흔들기) */
  shake: () => void;
}

export function mountStage(canvas: HTMLCanvasElement, options: StageOptions = {}): Stage {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) {
    throw new Error("Canvas 2D context 를 얻지 못했다");
  }
  // 클로저(resize/frame) 안에서도 non-null 로 쓰기 위해 확정된 참조로 옮긴다
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const engine = Engine.create();
  engine.gravity.y = PHYSICS.gravityY;

  const letters: LetterBody[] = [];
  let firstSpawnFired = false;

  // 글자 크기·잉크 면적 측정용 오프스크린 캔버스
  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = RENDER.fontSizePx * 2;
  measureCanvas.height = RENDER.fontSizePx * 2;
  const measureCtx = measureCanvas.getContext("2d", { willReadFrequently: true });
  const inkCache = new Map<string, number>();

  let viewWidth = 0;
  let viewHeight = 0;

  // ── 정적 경계: 바닥 + 좌우 벽 ──────────────────────────────
  // 리사이즈 때 위치만 다시 잡을 수 있도록 한 번 만들고 재배치한다.
  const t = WORLD.wallThicknessPx;
  const floor = Bodies.rectangle(0, 0, 1, t, { isStatic: true });
  const wallLeft = Bodies.rectangle(0, 0, t, 1, { isStatic: true });
  const wallRight = Bodies.rectangle(0, 0, t, 1, { isStatic: true });
  Composite.add(engine.world, [floor, wallLeft, wallRight]);

  function layoutBounds() {
    const w = viewWidth;
    const h = viewHeight;
    // 스케일이 1로 만들어졌으므로 setVertices 로 크기를 갱신한다
    Body.setVertices(floor, Bodies.rectangle(0, 0, w * 3, t, { isStatic: true }).vertices);
    Body.setPosition(floor, { x: w / 2, y: h + t / 2 });
    Body.setVertices(wallLeft, Bodies.rectangle(0, 0, t, h * 4, { isStatic: true }).vertices);
    Body.setPosition(wallLeft, { x: -t / 2, y: h / 2 });
    Body.setVertices(wallRight, Bodies.rectangle(0, 0, t, h * 4, { isStatic: true }).vertices);
    Body.setPosition(wallRight, { x: w + t / 2, y: h / 2 });
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, RENDER.maxDevicePixelRatio);
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    canvas.style.width = `${viewWidth}px`;
    canvas.style.height = `${viewHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutBounds();
  }

  resize();
  window.addEventListener("resize", resize);

  // ── 글자 스폰 ──────────────────────────────────────────────
  function measureLetter(char: string): { width: number; height: number } {
    const size = RENDER.fontSizePx;
    if (!measureCtx) {
      return { width: size, height: size };
    }
    measureCtx.font = `${size}px ${RENDER.fontFamily}`;
    const m = measureCtx.measureText(char);
    const width = Math.max(m.width, size * 0.2);
    const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || size;
    return { width, height };
  }

  /** 오프스크린에 글자를 그려 불투명 픽셀 수를 센다 — 이것이 질량이다 (PRD §4.2) */
  function measureInkArea(char: string): number {
    const cached = inkCache.get(char);
    if (cached !== undefined) {
      return cached;
    }
    if (!measureCtx) {
      return RENDER.fontSizePx * RENDER.fontSizePx * 0.3;
    }
    const size = measureCanvas.width;
    measureCtx.clearRect(0, 0, size, size);
    measureCtx.font = `${RENDER.fontSizePx}px ${RENDER.fontFamily}`;
    measureCtx.textAlign = "center";
    measureCtx.textBaseline = "middle";
    measureCtx.fillText(char, size / 2, size / 2);
    const pixels = measureCtx.getImageData(0, 0, size, size).data;
    let ink = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      const alpha = pixels[i];
      if (alpha !== undefined && alpha >= MASS.alphaThreshold) {
        ink++;
      }
    }
    inkCache.set(char, ink);
    return ink;
  }

  function spawnLetter(char: string) {
    const { width, height } = measureLetter(char);
    const jitter = (Math.random() - 0.5) * 2 * WORLD.spawnJitterPx;
    const x = viewWidth / 2 + jitter;
    const y = -(height / 2) - WORLD.spawnAboveTopPx;

    const bouncy = SHAPES.bouncyChars.includes(char);
    const bodyOptions: IChamferableBodyDefinition = {
      restitution: bouncy ? SHAPES.bouncyRestitution : PHYSICS.restitution,
      friction: bouncy ? SHAPES.bouncyFriction : PHYSICS.friction,
      frictionAir: bouncy ? SHAPES.bouncyFrictionAir : PHYSICS.frictionAir,
      angle: (Math.random() - 0.5) * 0.3,
    };

    // 원형 글자는 원형 충돌체 — 굴러간다. 나머지는 모서리 깎은 사각형 (PRD §4.2)
    // 단 작은 기호는 깎으면 거의 원이 되어 바퀴처럼 굴러다니므로 각지게 둔다
    const body = SHAPES.circles.includes(char)
      ? Bodies.circle(x, y, Math.max(width, height) / 2, bodyOptions)
      : Bodies.rectangle(x, y, width, height, bouncy ? bodyOptions : {
        ...bodyOptions,
        chamfer: { radius: Math.min(PHYSICS.chamferRadiusPx, width / 3, height / 3) },
      });

    // 잉크 면적 기반 질량 — 획이 많은 글자(뷁)는 무겁고, 이·아 는 가볍다
    Body.setMass(body, Math.max(MASS.min, measureInkArea(char) * MASS.perInkPixel));
    if (bouncy) {
      // 회전 관성을 키워 접촉 때마다 팽이처럼 도는 것을 막는다
      Body.setInertia(body, body.inertia * SHAPES.bouncyInertiaScale);
    }
    Composite.add(engine.world, body);
    letters.push({ body, char, width, height });

    if (!firstSpawnFired) {
      firstSpawnFired = true;
      options.onFirstSpawn?.();
    }

    // 상한 초과 시 가장 오래된 것부터 제거
    while (letters.length > WORLD.maxBodies) {
      const oldest = letters.shift();
      if (oldest) {
        Composite.remove(engine.world, oldest.body);
      }
    }
  }

  // ── 렌더 루프 ──────────────────────────────────────────────
  let lastTime = performance.now();

  function frame(now: number) {
    const delta = Math.min(now - lastTime, 1000 / 30); // 탭 전환 복귀 시 폭주 방지
    lastTime = now;
    Engine.update(engine, delta);

    // 화면 밖으로 떨어진 물체 제거
    for (let i = letters.length - 1; i >= 0; i--) {
      const letter = letters[i];
      if (letter && letter.body.position.y > viewHeight + WORLD.cullMarginPx) {
        Composite.remove(engine.world, letter.body);
        letters.splice(i, 1);
      }
    }

    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.font = `${RENDER.fontSizePx}px ${RENDER.fontFamily}`;
    ctx.fillStyle = RENDER.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const { body, char } of letters) {
      ctx.save();
      ctx.translate(body.position.x, body.position.y);
      ctx.rotate(body.angle);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);

  function setGravity(x: number, y: number) {
    engine.gravity.x = Math.max(-1, Math.min(1, x));
    engine.gravity.y = Math.max(-1, Math.min(1, y));
  }

  function shake() {
    for (const { body } of letters) {
      Body.setVelocity(body, {
        x: body.velocity.x + (Math.random() - 0.5) * 2 * MOTION.shakeKickPx,
        y: body.velocity.y - Math.random() * MOTION.shakeKickPx,
      });
    }
  }

  return { spawnLetter, setGravity, shake };
}
