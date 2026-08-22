# 남았당 클라이언트

동네 가게의 당일 마감 할인 상품을 예약하고 픽업하는 남았당의 웹 클라이언트다.

## 기술 스택

- React + TypeScript + Vite
- PWA + CSR SPA + React Router Data Mode
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

## 네이버 지도 설정

고객 지도 페이지와 가게 상세에서 Web Dynamic Map을 보여 주고, 가게 등록·수정 시 Geocoding으로 주소를 위도·경도로 변환한다. 네이버 클라우드 Maps Application에서 `Web Dynamic Map`과 `Geocoding`을 활성화한다.

Web 서비스 URL은 포트와 경로를 빼고 호스트만 등록한다.

- 로컬: `http://localhost`, `http://127.0.0.1`
- S3 테스트: `http://namatdang-teat-bucket.s3-website.ap-northeast-2.amazonaws.com`

발급받은 Client ID는 로컬 `.env.local`에 다음과 같이 설정한다. Client Secret은 브라우저 코드에 사용하지 않는다.

```bash
VITE_NAVER_MAP_NCP_KEY_ID=발급받은_CLIENT_ID
```

S3 배포 빌드에서는 같은 값을 GitHub Actions Repository Variable `VITE_NAVER_MAP_NCP_KEY_ID`로 추가한다.

## Firebase Cloud Messaging 설정

로그인 후 앱 안내에서 사용자가 알림 연결을 선택하면 브라우저 권한을 요청하고, 발급된 FCM 등록 토큰을 백엔드 `PUT /api/v1/push-tokens`에 저장한다. 알림 센터에서도 연결 상태를 확인하거나 다시 연결할 수 있다.

Firebase Console의 웹 앱 설정과 Cloud Messaging의 Web Push 인증서 공개 키를 `.env.local`에 설정한다.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

위 값은 브라우저에서 사용하는 공개 설정이다. Firebase Admin 서비스 계정 개인키는 프론트 환경 변수나 저장소에 추가하지 않는다.

## PWA 설정

웹 앱 Manifest와 FCM 서비스 워커를 함께 사용한다. 서비스 워커는 프로덕션 빌드에서 앱 셸과 같은 출처의 정적 자산을 캐시하고, 개발 서버에서는 오래된 소스 캐시가 개발을 방해하지 않도록 캐시를 비활성화한다.

로컬에서는 `pnpm build && pnpm preview`로 실행한 뒤 브라우저 개발자 도구의 Application 탭에서 Manifest, Service Worker, Cache Storage를 확인한다.

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
- 고객: 홈, 지도, 가게 상세, 할인 상세·예약, 예약 완료, 예약 목록·상세, 찜, 알림, 마이
- 가게 관리: 시작 안내, 가게 등록, 운영 현황, 할인 목록·등록·상세, 예약 관리, 가게 정보

고객은 모바일 우선, 가게 관리는 1024px 이상에서 사이드바와 예약 목록·상세 분할 화면을 제공한다. 인증·회원·가게·할인·예약·즐겨찾기·알림은 백엔드 API와 연동한다. 가게 관리에서는 할인 등록과 상세 조회를 제공하며, 예약 수령 완료 상태를 서버에 반영한다.

## 디렉터리

```text
src/
  app/          라우터와 앱 전역 provider
  features/     고객·인증·가게 관리 기능별 API, 상태와 UI
  layouts/      인증·고객·가게 관리 공통 셸
  pages/        라우트 단위 화면
  shared/       API, Query, 도메인 타입, 공통 UI와 유틸리티
  index.css     Tailwind와 디자인 토큰
e2e/            Playwright 테스트
public/brand/   실제 제품에서 사용하는 남았당 브랜드 자산
```
