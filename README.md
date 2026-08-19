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

## 구현된 핵심 화면

- 인증: 로그인, 회원가입
- 고객: 홈, 가게 상세, 할인 상세·예약 확인, 예약 완료, 예약 목록, 예약 상세, 마이
- 가게 관리: 시작 안내, 가게 등록, 운영 현황, 할인 목록, 할인 등록·수정, 예약 관리, 가게 정보

할인 등록·수정은 하나의 공용 화면을 사용한다. 고객은 모바일 우선, 가게 관리는 1024px 이상에서 사이드바와 예약 목록·상세 분할 화면을 제공한다. 현재 화면 데이터와 제출 동작은 목 상태이며 API·인증 연동은 다음 단계에서 교체한다.

## 디렉터리

```text
src/
  app/          라우터와 앱 전역 provider
  features/     고객·인증·가게 관리 기능별 UI와 목 상태
  layouts/      인증·고객·가게 관리 공통 셸
  pages/        라우트 단위 화면
  shared/       API, Query, 도메인 타입, 공통 UI와 유틸리티
  index.css     Tailwind와 디자인 토큰
e2e/            Playwright 테스트
public/brand/   실제 제품에서 사용하는 남았당 브랜드 자산
```
