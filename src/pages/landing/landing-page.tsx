import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock3,
  Heart,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
} from "lucide-react"
import { Link } from "react-router"
import {
  getAccessToken,
  hasUsableAccessToken,
} from "../../features/auth/auth-session"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const journeySteps = [
  {
    id: "discover",
    number: "01",
    label: "발견",
    title: "가까운 마감 상품을 발견해요",
    description:
      "지금 픽업할 수 있는 동네 가게와 남은 상품을 한눈에 살펴보세요.",
    detail: "가게 위치와 픽업 시간을 함께 비교할 수 있어요.",
    icon: Search,
  },
  {
    id: "reserve",
    number: "02",
    label: "예약",
    title: "원하는 상품을 미리 예약해요",
    description:
      "남은 수량과 픽업 시간을 확인하고 필요한 만큼 간편하게 예약하세요.",
    detail: "예약 내역은 한곳에서 다시 확인할 수 있어요.",
    icon: CalendarCheck,
  },
  {
    id: "pickup",
    number: "03",
    label: "픽업",
    title: "약속한 시간에 가볍게 픽업해요",
    description:
      "가게에 방문해 준비된 상품을 받고, 동네의 좋은 가게를 다시 찾아보세요.",
    detail: "사장님은 예약 현황을 PC 관리 화면에서 확인해요.",
    icon: ShoppingBag,
  },
] as const

const faqItems = [
  {
    question: "남았당은 어떤 서비스인가요?",
    answer:
      "동네 가게가 영업 마감 전에 남은 상품을 알리고, 사용자가 발견·예약·픽업할 수 있도록 연결하는 서비스입니다.",
  },
  {
    question: "가게를 등록하려면 별도 사장님 계정이 필요한가요?",
    answer:
      "아니요. 일반 회원가입 후 가게를 등록하면 같은 계정으로 고객 기능과 가게 관리 기능을 함께 이용할 수 있습니다.",
  },
  {
    question: "예약한 상품은 어떻게 받나요?",
    answer:
      "상품에 안내된 픽업 시간을 확인한 뒤 가게에 방문해 받으면 됩니다. 실제 Deal·예약 기능은 백엔드 API 개발 범위에 맞춰 순차적으로 제공될 예정입니다.",
  },
  {
    question: "가게 관리는 모바일에서도 가능한가요?",
    answer:
      "반응형 화면으로 모바일에서도 접근할 수 있고, Deal·재고·예약을 한눈에 살펴볼 때는 넓은 PC 화면을 권장합니다.",
  },
] as const

function useAuthenticationState() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    hasUsableAccessToken(getAccessToken()),
  )

  useEffect(() => {
    const refreshAuthenticationState = () => {
      setIsAuthenticated(hasUsableAccessToken(getAccessToken()))
    }

    window.addEventListener("storage", refreshAuthenticationState)
    window.addEventListener("focus", refreshAuthenticationState)

    return () => {
      window.removeEventListener("storage", refreshAuthenticationState)
      window.removeEventListener("focus", refreshAuthenticationState)
    }
  }, [])

  return isAuthenticated
}

function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="border-hairline bg-customer-canvas/90 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg"
          aria-label="남았당 랜딩 홈"
        >
          <img
            src="/brand/namatdang-logo.png"
            width="2048"
            height="768"
            className="h-8 w-auto sm:h-9"
            alt="남았당"
          />
        </Link>

        <nav
          aria-label="랜딩 페이지 주요 메뉴"
          className="hidden items-center gap-1 lg:flex"
        >
          <a
            href="#how-it-works"
            className="text-muted hover:bg-canvas hover:text-foreground inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors"
          >
            이용 방법
          </a>
          <a
            href="#for-everyone"
            className="text-muted hover:bg-canvas hover:text-foreground inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors"
          >
            고객과 사장님
          </a>
          <a
            href="#management-preview"
            className="text-muted hover:bg-canvas hover:text-foreground inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors"
          >
            관리 미리보기
          </a>
          <a
            href="#faq"
            className="text-muted hover:bg-canvas hover:text-foreground inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors"
          >
            자주 묻는 질문
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {!isAuthenticated ? (
            <Button asChild variant="ghost" size="compact">
              <Link to="/login">로그인</Link>
            </Button>
          ) : null}
          <Button asChild size="compact">
            <Link to={isAuthenticated ? "/app" : "/signup"}>
              <span className="sm:hidden">
                {isAuthenticated ? "서비스로" : "시작하기"}
              </span>
              <span className="hidden sm:inline">
                {isAuthenticated ? "서비스로 이동" : "지금 시작하기"}
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[35rem] lg:mr-0">
      <div
        className="bg-primary/15 absolute -inset-5 -z-10 rounded-[3rem] blur-2xl"
        aria-hidden="true"
      />
      <div className="border-hairline bg-canvas relative overflow-hidden rounded-[2rem] border p-3 shadow-[0_28px_80px_rgba(78,36,16,0.14)] sm:p-5">
        <div className="border-hairline flex items-center justify-between border-b px-2 pb-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary size-2.5 rounded-full" />
            <span className="bg-bread-cream size-2.5 rounded-full" />
            <span className="bg-hairline size-2.5 rounded-full" />
          </div>
          <span className="bg-brand-tint text-brand-brown rounded-full px-3 py-1 text-xs font-semibold">
            화면 예시
          </span>
        </div>

        <div className="grid gap-4 p-2 pt-5 sm:grid-cols-[1fr_0.82fr] sm:p-4 sm:pt-6">
          <article className="bg-customer-canvas border-hairline overflow-hidden rounded-2xl border">
            <div className="bg-bread-cream relative flex aspect-[16/10] items-end overflow-hidden p-4">
              <div
                className="bg-primary/20 absolute -top-8 -right-4 size-32 rounded-full"
                aria-hidden="true"
              />
              <div
                className="bg-canvas/70 absolute top-5 right-16 size-16 rotate-12 rounded-[1.2rem]"
                aria-hidden="true"
              />
              <div className="relative flex items-end gap-2" aria-hidden="true">
                <span className="bg-brand-brown block h-16 w-20 rounded-t-[2rem] rounded-b-xl" />
                <span className="bg-primary block h-12 w-16 rounded-t-[1.6rem] rounded-b-lg" />
                <span className="bg-canvas block h-10 w-12 rounded-t-[1.3rem] rounded-b-lg" />
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-brand-link text-sm font-bold">
                  마감 Deal
                </span>
                <span
                  className="border-hairline bg-canvas inline-flex size-9 items-center justify-center rounded-full border"
                  aria-hidden="true"
                >
                  <Heart size={17} />
                </span>
              </div>
              <h2 className="text-lg font-bold">오늘의 빵 꾸러미</h2>
              <p className="text-muted mt-1 text-sm">동네 빵집 · 걸어서 픽업</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-muted text-xs line-through">9,000원</p>
                  <p className="text-xl font-bold">5,900원</p>
                </div>
                <span className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-bold">
                  예약하기
                </span>
              </div>
            </div>
          </article>

          <div className="grid gap-3 sm:content-center">
            <div className="bg-brand-brown text-canvas rounded-2xl p-4 shadow-lg transition-transform duration-500 motion-safe:hover:-translate-y-1 motion-reduce:transition-none">
              <CalendarCheck aria-hidden="true" className="text-primary" />
              <p className="mt-5 text-xs text-white/70">예약 완료</p>
              <p className="mt-1 font-bold">픽업 준비를 기다려 주세요</p>
              <p className="mt-3 text-xs text-white/70">오늘 19:00–20:00</p>
            </div>
            <div className="border-hairline bg-canvas rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="bg-bread-cream text-brand-brown inline-flex size-10 items-center justify-center rounded-xl">
                  <MapPin aria-hidden="true" size={19} />
                </span>
                <div>
                  <p className="text-muted text-xs">가까운 가게</p>
                  <p className="mt-0.5 text-sm font-bold">동네에서 바로 픽업</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-orange-100">
      <div
        className="bg-primary/10 absolute top-12 -left-28 -z-10 size-80 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-bread-cream absolute -right-32 bottom-0 -z-10 size-96 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="bg-brand-tint text-brand-brown mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            <Sparkles aria-hidden="true" size={17} />
            오늘 남은 좋은 것을 가까이에서
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-brand-brown text-[2.55rem] leading-[1.12] font-black tracking-[-0.045em] text-balance sm:text-6xl lg:text-[4.15rem]"
          >
            마감 재고를 판매 기회로,
            <span className="text-primary mt-1 block">첫 방문을 단골로.</span>
          </h1>
          <p className="text-muted mt-7 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
            가까운 가게의 마감 상품을 발견하고 예약해 원하는 시간에 픽업하세요.
            사장님은 같은 계정으로 가게 운영까지 이어갈 수 있어요.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-14 px-6 text-base">
              <Link to={isAuthenticated ? "/app" : "/signup"}>
                {isAuthenticated ? "남았당으로 이동" : "지금 사용해보기"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="min-h-14 px-6 text-base"
            >
              <Link
                to={
                  isAuthenticated
                    ? "/manage/onboarding"
                    : "/login?redirect=%2Fmanage%2Fonboarding"
                }
              >
                <Store aria-hidden="true" />내 가게 등록하기
              </Link>
            </Button>
          </div>

          <p className="text-muted mt-5 flex items-start gap-2 text-sm leading-6">
            <Check
              aria-hidden="true"
              className="text-success mt-0.5 shrink-0"
              size={18}
            />
            별도 사장님 가입 없이, 회원가입 후 가게를 등록하면 관리 기능이
            열려요.
          </p>
        </div>

        <HeroPreview />
      </div>
    </section>
  )
}

function JourneySection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeStep = journeySteps[activeIndex]
  const ActiveIcon = activeStep.icon

  const moveFocus = (index: number) => {
    setActiveIndex(index)
    tabRefs.current[index]?.focus()
  }

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % journeySteps.length
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + journeySteps.length) % journeySteps.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = journeySteps.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      moveFocus(nextIndex)
    }
  }

  return (
    <section
      id="how-it-works"
      className="bg-canvas scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="journey-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-brand-link text-sm font-bold">이용 방법</p>
          <h2
            id="journey-title"
            className="text-foreground mt-3 text-3xl font-black tracking-tight text-balance sm:text-5xl"
          >
            발견부터 픽업까지, 오늘 안에
          </h2>
          <p className="text-muted mt-5 text-base leading-7 sm:text-lg">
            필요한 정보만 순서대로 확인해 부담 없이 이용할 수 있어요.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div
            role="tablist"
            aria-label="남았당 이용 단계"
            className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
          >
            {journeySteps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === activeIndex

              return (
                <button
                  key={step.id}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  id={`journey-tab-${step.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="journey-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  className={`min-h-24 rounded-2xl border p-4 text-left transition-[background-color,border-color,transform] duration-300 motion-reduce:transition-none sm:p-5 ${
                    isActive
                      ? "border-primary bg-brand-tint lg:translate-x-2"
                      : "border-hairline bg-canvas hover:border-primary/50 hover:bg-surface"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex size-10 items-center justify-center rounded-xl ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted"
                      }`}
                    >
                      <StepIcon aria-hidden="true" size={20} />
                    </span>
                    <span className="text-muted text-xs font-bold">
                      {step.number}
                    </span>
                  </span>
                  <span className="mt-4 block font-bold">{step.label}</span>
                </button>
              )
            })}
          </div>

          <div
            id="journey-panel"
            role="tabpanel"
            aria-labelledby={`journey-tab-${activeStep.id}`}
            tabIndex={0}
            className="bg-brand-brown text-canvas relative min-h-[28rem] overflow-hidden rounded-[2rem] p-6 sm:p-10"
          >
            <div
              className="bg-primary/25 absolute -top-24 -right-16 size-72 rounded-full blur-2xl"
              aria-hidden="true"
            />
            <div className="relative grid h-full gap-8 md:grid-cols-[1fr_0.82fr] md:items-center">
              <div>
                <span className="bg-canvas/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold">
                  <ActiveIcon aria-hidden="true" size={17} />
                  {activeStep.number} · {activeStep.label}
                </span>
                <h3 className="mt-6 text-3xl leading-tight font-black text-balance sm:text-4xl">
                  {activeStep.title}
                </h3>
                <p className="mt-5 max-w-lg leading-7 text-white/75">
                  {activeStep.description}
                </p>
                <p className="mt-6 flex items-start gap-2 text-sm font-semibold text-white/90">
                  <Check
                    aria-hidden="true"
                    className="text-primary mt-0.5 shrink-0"
                    size={18}
                  />
                  {activeStep.detail}
                </p>
              </div>

              <div
                className="bg-customer-canvas text-foreground mx-auto w-full max-w-xs rounded-[2rem] border-[6px] border-white/10 p-4 shadow-2xl transition-transform duration-500 motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
                aria-label={`${activeStep.label} 화면 예시`}
              >
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-black/15" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brand-link text-xs font-bold">
                      화면 예시
                    </p>
                    <p className="mt-1 font-bold">{activeStep.label}하기</p>
                  </div>
                  <span className="bg-brand-tint text-brand-brown inline-flex size-10 items-center justify-center rounded-xl">
                    <ActiveIcon aria-hidden="true" size={20} />
                  </span>
                </div>
                <div className="mt-5 grid gap-3">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className={`border-hairline flex items-center gap-3 rounded-xl border p-3 ${
                        item === activeIndex ? "bg-brand-tint" : "bg-canvas"
                      }`}
                    >
                      <span
                        className={`block size-10 shrink-0 rounded-lg ${
                          item === activeIndex ? "bg-primary/30" : "bg-surface"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="bg-foreground/80 block h-2.5 w-3/4 rounded-full" />
                        <span className="bg-hairline mt-2 block h-2 w-full rounded-full" />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary text-primary-foreground mt-5 flex min-h-11 items-center justify-center rounded-xl text-sm font-bold">
                  다음 단계로
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ServicePreviewSection() {
  return (
    <section
      className="bg-customer-canvas px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="preview-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-brand-link text-sm font-bold">
              서비스 화면 미리보기
            </p>
            <h2
              id="preview-title"
              className="mt-3 text-3xl font-black tracking-tight text-balance sm:text-5xl"
            >
              필요한 순간에 바로 보이는 정보
            </h2>
          </div>
          <p className="bg-brand-tint text-brand-brown max-w-md rounded-xl px-4 py-3 text-sm leading-6 font-medium">
            아래 Deal·예약 UI는 화면 예시입니다. 실제 제공 범위는 백엔드 API
            연동에 따라 달라질 수 있어요.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <article className="border-hairline bg-canvas group rounded-[1.75rem] border p-6 transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transition-none sm:p-7">
            <span className="bg-bread-cream text-brand-brown inline-flex size-12 items-center justify-center rounded-2xl">
              <Search aria-hidden="true" />
            </span>
            <p className="text-brand-link mt-8 text-xs font-bold">
              Deal 화면 예시
            </p>
            <h3 className="mt-2 text-xl font-bold">근처 마감 상품 찾기</h3>
            <p className="text-muted mt-3 text-sm leading-6">
              상품, 남은 수량, 픽업 시간을 카드에서 빠르게 비교해요.
            </p>
            <div className="bg-surface mt-7 rounded-2xl p-4">
              <div className="bg-bread-cream h-28 rounded-xl" />
              <span className="bg-primary mt-4 block h-2.5 w-1/4 rounded-full" />
              <span className="bg-foreground/80 mt-3 block h-3 w-3/4 rounded-full" />
              <span className="bg-hairline mt-3 block h-2 w-full rounded-full" />
            </div>
          </article>

          <article className="border-hairline bg-canvas group rounded-[1.75rem] border p-6 transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transition-none sm:p-7">
            <span className="bg-brand-tint text-brand-brown inline-flex size-12 items-center justify-center rounded-2xl">
              <CalendarCheck aria-hidden="true" />
            </span>
            <p className="text-brand-link mt-8 text-xs font-bold">
              예약 화면 예시
            </p>
            <h3 className="mt-2 text-xl font-bold">예약 상태 한눈에 확인</h3>
            <p className="text-muted mt-3 text-sm leading-6">
              예정된 픽업과 지난 내역을 구분해 필요한 예약을 찾아요.
            </p>
            <div className="bg-brand-brown text-canvas mt-7 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="bg-primary/20 text-primary rounded-full px-3 py-1 text-xs font-bold">
                  픽업 예정
                </span>
                <Clock3 aria-hidden="true" className="text-white/65" />
              </div>
              <span className="mt-8 block h-3 w-3/4 rounded-full bg-white/90" />
              <span className="mt-3 block h-2 w-full rounded-full bg-white/20" />
              <span className="mt-2 block h-2 w-2/3 rounded-full bg-white/20" />
            </div>
          </article>

          <article className="border-hairline bg-canvas group rounded-[1.75rem] border p-6 transition-transform duration-300 motion-safe:hover:-translate-y-1 motion-reduce:transition-none sm:p-7">
            <span className="bg-surface text-brand-brown inline-flex size-12 items-center justify-center rounded-2xl">
              <Heart aria-hidden="true" />
            </span>
            <p className="text-brand-link mt-8 text-xs font-bold">가게 화면</p>
            <h3 className="mt-2 text-xl font-bold">좋아하는 가게 다시 찾기</h3>
            <p className="text-muted mt-3 text-sm leading-6">
              관심 있는 가게를 저장하고 새 소식을 확인할 수 있어요.
            </p>
            <div className="border-hairline mt-7 rounded-2xl border p-4">
              {["가게 기본 정보", "픽업 안내", "관심 가게 저장"].map(
                (label, index) => (
                  <div
                    key={label}
                    className={`flex items-center gap-3 py-3 ${
                      index > 0 ? "border-hairline border-t" : ""
                    }`}
                  >
                    <Check
                      aria-hidden="true"
                      className="text-success"
                      size={18}
                    />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ),
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function AudienceSection() {
  return (
    <section
      id="for-everyone"
      className="bg-canvas scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="audience-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-brand-link text-sm font-bold">하나의 서비스</p>
          <h2
            id="audience-title"
            className="mt-3 text-3xl font-black tracking-tight text-balance sm:text-5xl"
          >
            고객의 발견과 가게의 운영이 이어져요
          </h2>
          <p className="text-muted mt-5 leading-7 sm:text-lg">
            역할을 먼저 고르는 방식이 아니에요. 누구나 일반 사용자로 시작하고,
            가게를 등록하면 같은 계정으로 관리할 수 있어요.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="bg-bread-cream relative overflow-hidden rounded-[2rem] p-7 sm:p-10">
            <div
              className="bg-primary/15 absolute -right-12 -bottom-20 size-64 rounded-full"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="bg-canvas text-brand-brown inline-flex size-14 items-center justify-center rounded-2xl shadow-sm">
                <ShoppingBag aria-hidden="true" />
              </span>
              <p className="text-brand-link mt-8 text-sm font-bold">
                모든 사용자
              </p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">
                가까운 가게를 새롭게 발견해요
              </h3>
              <ul className="mt-7 grid gap-4">
                {[
                  "마감 상품과 픽업 시간 비교",
                  "예약 내역과 알림 확인",
                  "관심 있는 가게 저장",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 font-medium"
                  >
                    <span className="bg-canvas text-success inline-flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Check aria-hidden="true" size={17} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="bg-brand-brown text-canvas relative overflow-hidden rounded-[2rem] p-7 sm:p-10">
            <div
              className="bg-primary/20 absolute -top-20 -right-16 size-64 rounded-full"
              aria-hidden="true"
            />
            <div className="relative">
              <span className="bg-canvas/10 text-primary inline-flex size-14 items-center justify-center rounded-2xl">
                <Store aria-hidden="true" />
              </span>
              <p className="text-primary mt-8 text-sm font-bold">
                가게 등록 후
              </p>
              <h3 className="mt-2 text-2xl font-black sm:text-3xl">
                PC에서 가게 운영을 한눈에 봐요
              </h3>
              <ul className="mt-7 grid gap-4">
                {[
                  "가게 기본 정보 관리",
                  "Deal·재고 운영 화면",
                  "예약과 픽업 현황 확인",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 font-medium text-white/90"
                  >
                    <span className="bg-primary/20 text-primary inline-flex size-8 shrink-0 items-center justify-center rounded-full">
                      <Check aria-hidden="true" size={17} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function ManagementPreviewSection() {
  return (
    <section
      id="management-preview"
      className="bg-background scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="management-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-brand-link text-sm font-bold">사장님 관리</p>
          <h2
            id="management-title"
            className="mt-3 text-3xl font-black tracking-tight text-balance sm:text-5xl"
          >
            넓은 화면에서 운영 흐름을 더 선명하게
          </h2>
          <p className="text-muted mt-5 leading-7 sm:text-lg">
            가게 정보부터 Deal, 재고, 예약까지 PC 중심의 관리 화면으로 정리해요.
          </p>
        </div>

        <div className="border-hairline bg-canvas mt-12 overflow-hidden rounded-[1.5rem] border shadow-[0_28px_90px_rgba(33,33,36,0.1)] sm:rounded-[2rem]">
          <div className="border-hairline flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="bg-critical/70 size-2.5 rounded-full" />
              <span className="bg-primary/70 size-2.5 rounded-full" />
              <span className="bg-success/70 size-2.5 rounded-full" />
            </div>
            <span className="bg-brand-tint text-brand-brown rounded-full px-3 py-1 text-xs font-bold">
              관리 화면 예시 · 데스크톱
            </span>
          </div>

          <div className="grid min-h-[34rem] lg:grid-cols-[14rem_1fr]">
            <aside className="bg-brand-brown text-canvas hidden p-5 lg:block">
              <img
                src="/brand/namatdang-logo.png"
                width="2048"
                height="768"
                className="h-8 w-auto rounded bg-white/95 px-2 py-1"
                alt=""
              />
              <div className="mt-8 grid gap-2" aria-hidden="true">
                {[
                  { label: "운영 홈", icon: LayoutDashboard, active: true },
                  { label: "Deal 관리", icon: Tag, active: false },
                  { label: "예약 관리", icon: CalendarCheck, active: false },
                  { label: "가게 정보", icon: Store, active: false },
                ].map(({ label, icon: Icon, active }) => (
                  <div
                    key={label}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                      active ? "bg-canvas text-brand-brown" : "text-white/65"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </div>
                ))}
              </div>
            </aside>

            <div className="bg-surface p-4 sm:p-7 lg:p-9">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-brand-link text-sm font-bold">
                    가게 운영 홈
                  </p>
                  <h3 className="mt-1 text-2xl font-black">
                    오늘의 운영을 확인하세요
                  </h3>
                </div>
                <span className="border-hairline bg-canvas inline-flex min-h-11 items-center gap-2 self-start rounded-xl border px-4 text-sm font-semibold">
                  <Store aria-hidden="true" size={18} />내 가게
                </span>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Deal 관리",
                    description: "판매 상태와 재고 확인",
                    icon: Tag,
                  },
                  {
                    label: "예약 현황",
                    description: "픽업 준비 흐름 확인",
                    icon: CalendarCheck,
                  },
                  {
                    label: "가게 정보",
                    description: "운영 정보 최신화",
                    icon: Store,
                  },
                ].map(({ label, description, icon: Icon }) => (
                  <article
                    key={label}
                    className="border-hairline bg-canvas rounded-2xl border p-5"
                  >
                    <span className="bg-brand-tint text-brand-brown inline-flex size-10 items-center justify-center rounded-xl">
                      <Icon aria-hidden="true" size={19} />
                    </span>
                    <h4 className="mt-5 font-bold">{label}</h4>
                    <p className="text-muted mt-1 text-sm leading-5">
                      {description}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="border-hairline bg-canvas rounded-2xl border p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold">운영 항목</h4>
                    <span className="text-muted text-xs">화면 예시</span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      {
                        label: "저녁 Deal",
                        detail: "판매 상태와 남은 재고 확인",
                        status: "판매 중",
                      },
                      {
                        label: "픽업 준비",
                        detail: "예약 목록과 방문 시간 확인",
                        status: "확인 필요",
                      },
                      {
                        label: "가게 정보",
                        detail: "주소와 운영 안내 검토",
                        status: "관리",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="border-hairline flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-muted mt-1 text-xs">
                            {item.detail}
                          </p>
                        </div>
                        <span className="bg-brand-tint text-brand-brown self-start rounded-full px-3 py-1 text-xs font-bold">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-brand-brown text-canvas rounded-2xl p-5 sm:p-6">
                  <PackageCheck aria-hidden="true" className="text-primary" />
                  <h4 className="mt-6 text-xl font-bold">픽업 준비 흐름</h4>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    예약 확인부터 전달 완료까지 필요한 상태를 한곳에서 살펴봐요.
                  </p>
                  <div className="mt-7 grid gap-3">
                    {["예약 확인", "상품 준비", "픽업 완료"].map(
                      (label, index) => (
                        <div key={label} className="flex items-center gap-3">
                          <span
                            className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                              index === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-canvas/10 text-white/70"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold">{label}</span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section
      id="faq"
      className="bg-canvas scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <p className="text-brand-link text-sm font-bold">FAQ</p>
          <h2
            id="faq-title"
            className="mt-3 text-3xl font-black tracking-tight sm:text-5xl"
          >
            궁금한 점을 먼저 확인해 보세요
          </h2>
          <p className="text-muted mt-5 leading-7">
            남았당을 시작하기 전에 자주 묻는 내용을 모았어요.
          </p>
        </div>

        <div className="border-hairline border-t">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border-hairline border-b"
            >
              <summary className="text-foreground flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 font-bold [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span className="bg-surface text-muted inline-flex size-9 shrink-0 items-center justify-center rounded-full">
                  <ChevronDown
                    aria-hidden="true"
                    className="transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    size={18}
                  />
                </span>
              </summary>
              <p className="text-muted max-w-2xl pr-12 pb-6 text-sm leading-7 sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCallToAction({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="bg-customer-canvas px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
      <div className="bg-brand-brown text-canvas relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          className="bg-primary/25 absolute -top-28 left-1/2 size-80 -translate-x-1/2 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="bg-canvas/10 text-primary inline-flex size-12 items-center justify-center rounded-2xl">
            <Sparkles aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-balance sm:text-5xl">
            오늘 남은 좋은 것을 만나보세요
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70 sm:text-lg">
            동네 가게와 사용자가 더 가볍게 연결되는 경험을 지금 시작해 보세요.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="min-h-14 px-6 text-base">
              <Link to={isAuthenticated ? "/app" : "/signup"}>
                {isAuthenticated ? "서비스로 돌아가기" : "남았당 시작하기"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="min-h-14 border-white/20 bg-white/10 px-6 text-base text-white hover:bg-white/15"
            >
              <Link
                to={
                  isAuthenticated
                    ? "/manage/onboarding"
                    : "/login?redirect=%2Fmanage%2Fonboarding"
                }
              >
                <Store aria-hidden="true" />
                가게 등록 알아보기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-hairline bg-customer-canvas border-t px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <img
            src="/brand/namatdang-logo.png"
            width="2048"
            height="768"
            className="h-8 w-auto"
            alt="남았당"
          />
          <p className="text-muted mt-3 text-sm">
            오늘 남은 좋은 것을 가까이에서.
          </p>
        </div>
        <nav aria-label="하단 메뉴" className="flex flex-wrap gap-x-5 gap-y-2">
          <a
            href="#how-it-works"
            className="text-muted hover:text-foreground text-sm font-medium"
          >
            이용 방법
          </a>
          <a
            href="#management-preview"
            className="text-muted hover:text-foreground text-sm font-medium"
          >
            가게 관리
          </a>
          <a
            href="#faq"
            className="text-muted hover:text-foreground text-sm font-medium"
          >
            FAQ
          </a>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  useDocumentTitle("오늘 남은 좋은 것을 가까이에서")
  const isAuthenticated = useAuthenticationState()

  return (
    <div className="bg-customer-canvas text-foreground min-h-svh overflow-x-clip">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main id="main-content">
        <HeroSection isAuthenticated={isAuthenticated} />
        <JourneySection />
        <ServicePreviewSection />
        <AudienceSection />
        <ManagementPreviewSection />
        <FaqSection />
        <FinalCallToAction isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter />
    </div>
  )
}
