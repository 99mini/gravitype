// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages 서브패스(https://99mini.github.io/gravitype) 배포.
// base 를 빼먹으면 자산 경로가 전부 깨진다 — PRD Day 0 의 대표적 함정.
export default defineConfig({
  site: "https://99mini.github.io",
  base: "/gravitype",
});
