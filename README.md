# babitalk-front-hermes

babitalk 프론트엔드 모노레포에 특화된 로컬 AI Q&A 툴.

스크린샷 + URL + 자연어 질문 → 코드 근거가 있는 답변.

## Install

```bash
pnpm install
pnpm -r build
# 전역 bin으로 등록 (~/.local/bin 은 이미 PATH에 있음)
chmod +x packages/cli/dist/index.js
ln -sf "$PWD/packages/cli/dist/index.js" ~/.local/bin/fe-hermes
```

> CLI 이름은 `fe-hermes` 입니다. (`hermes` 는 별도 도구가 점유 중)

## First-time setup

```bash
fe-hermes init
# ~/.fe-hermes/config.json 생성 + .env.example 가이드
cp .env.example .env
# .env에 ANTHROPIC_API_KEY 입력
export HERMES_TARGET_ROOT=~/repos/babitalk_monorepo_frontend
```

## Commands

```bash
fe-hermes index                                         # 인덱스 빌드 (대상 root에 .hermes/index.json)
fe-hermes ask -q "..." [-u <URL>] [-i screenshot.png]   # 단발 질의
fe-hermes chat [-u <URL>] [-i screenshot.png]           # 대화형 REPL
```

공통 옵션: `--verbose` (tool 흐름) / `--debug` (raw I/O) / `--yes-i-know` (50K token 가드 무시)

## 한계 (반드시 참고)

- 백엔드 영향도는 추론하지 않습니다 (FE 인덱스만 봄)
- 정적 분석만 — 런타임 분기/동적 라우팅은 누락 가능
- `node_modules`는 인덱싱 제외
- 100% 정확도 비보장. 답변은 반드시 파일:라인 근거로 검증할 것

## 정확도 측정

```bash
pnpm accuracy   # tests/golden/questions.json 셋으로 회귀 측정
```

## Spec / Plan

- [docs/specs/2026-05-29-design.md](docs/specs/2026-05-29-design.md)
- [docs/plans/2026-05-29-cli-mvp.md](docs/plans/2026-05-29-cli-mvp.md)
