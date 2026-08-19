# 남았당 클라이언트

동네 가게의 당일 마감 할인 상품을 예약하고 픽업하는 남았당의 웹 클라이언트다.

## 기술 스택

- React + TypeScript + Vite
- CSR SPA + React Router Data Mode
- TanStack Query
- Tailwind CSS v4 + shadcn/ui 방식의 소스 컴포넌트
- React Hook Form + Zod
- Zustand (여러 화면이 공유하는 복잡한 로컬 상태가 생길 때만 사용)
- Vitest + Testing Library + Playwright
- ESLint + Prettier
- pnpm

## 시작하기

Node.js 22.12 이상과 pnpm 11 이상이 필요하다. 권장 Node 메이저 버전은 `.nvmrc`에 기록한다.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

기본 API 주소는 `VITE_API_BASE_URL`로 설정한다.

## 주요 명령어

```bash
pnpm dev           # 개발 서버
pnpm typecheck     # TypeScript 검사
pnpm lint          # ESLint 검사
pnpm format:check  # Prettier 검사
pnpm test          # 단위·컴포넌트 테스트
pnpm test:e2e      # Playwright 핵심 흐름 테스트
pnpm build         # 프로덕션 빌드
pnpm check         # typecheck → lint → test → build
```

## 디렉터리

```text
src/
  app/          라우터와 앱 전역 provider
  components/   공통 UI와 shadcn 기반 컴포넌트
  pages/        라우트 단위 화면
  shared/       API, Query, 공통 유틸리티
  styles/       Tailwind와 디자인 토큰
e2e/            Playwright 테스트
public/brand/   실제 제품에서 사용하는 남았당 브랜드 자산
```
