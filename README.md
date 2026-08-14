# Gravitype

> 타이핑한 글자가 물리 객체가 되어 떨어지고, 쌓이고, 무너지는 웹 장난감.

**배포**: https://99mini.github.io/gravitype/

글자를 입력하면 그 글자가 질량과 형태를 가진 물체가 되어 화면에 떨어진다.
폰을 기울이고 흔들어서 쌓인 글자 더미를 무너뜨린다.

## 기술

| 항목 | 선택 |
| --- | --- |
| 프레임워크 | Astro (SSG + CSR, 서버 없음) |
| 물리 | matter.js |
| 렌더 | Canvas 2D 직접 렌더 |
| 언어 | TypeScript |
| 배포 | GitHub Actions → GitHub Pages |

## 명령

```sh
pnpm install
pnpm dev        # 개발 서버
pnpm build      # 정적 빌드 (dist/)
pnpm typecheck  # astro check
pnpm lint       # oxlint
```

## 로드맵 (작은 PR 단위)

- [x] PR 1 — Astro 스캐폴드 + GitHub Pages 배포 파이프라인
- [ ] PR 2 — matter.js 월드, 바닥·벽, 캔버스 렌더 루프
- [ ] PR 3 — 탭 → 키보드 → 글자 낙하 (IME 조합 처리 포함)
- [ ] PR 4 — 잉크 면적 질량 + 원형/막대 특수 충돌체
- [ ] PR 5 — 기울기 중력 / 흔들기 임펄스
- [ ] PR 6 — 드래그로 집어 던지기
- [ ] PR 7 — 키보드 대응 동적 바닥 (visualViewport)
- [ ] PR 8 — 물체 수 제한·성능 정리 + 지우기 연출
- [ ] PR 9 — URL 공유 및 재생, 스크린샷 공유
- [ ] PR 10 — 첫 진입 힌트 다듬기, OG 이미지·메타태그

상세 기획은 PRD 참고. 물리 상수는 한 파일(`src/lib/constants.ts`)에 모은다.
