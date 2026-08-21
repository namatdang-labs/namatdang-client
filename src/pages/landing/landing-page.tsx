import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBag,
  Store,
  Tag,
} from "lucide-react"
import { Link } from "react-router"

import {
  getAccessToken,
  hasUsableAccessToken,
} from "../../features/auth/auth-session"
import {
  sellingDealsQueryOptions,
  type SellingDealDto,
} from "../../features/customer/customer-api"
import {
  DealCard,
  DealGridSkeleton,
} from "../../features/customer/customer-components"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const journeySteps = [
  {
    title: "할인 찾기",
    description: "목록이나 지도에서 방문하기 좋은 상품을 골라요.",
    icon: Search,
  },
  {
    title: "예약하기",
    description: "품목과 수량을 고르고 예약 금액과 방문 정보를 확인해요.",
    icon: CalendarCheck,
  },
  {
    title: "매장에서 픽업",
    description: "예약 내용을 확인한 뒤 가게를 방문해 준비된 상품을 받아요.",
    icon: ShoppingBag,
  },
] as const

const dealInformation = [
  {
    title: "최종 가격",
    description: "할인이 적용된 예약 금액을 먼저 확인해요.",
    icon: Tag,
  },
  {
    title: "남은 수량",
    description: "지금 예약할 수 있는 수량을 확인해요.",
    icon: PackageCheck,
  },
  {
    title: "예약 마감",
    description: "예약할 수 있는 마지막 시각을 확인해요.",
    icon: Clock3,
  },
  {
    title: "가게 위치",
    description: "픽업할 가게와 지도 위치를 확인해요.",
    icon: MapPin,
  },
] as const

const faqItems = [
  {
    question: "로그인하지 않아도 할인 상품을 볼 수 있나요?",
    answer:
      "네. 할인 목록과 가게, 지도는 로그인 없이 둘러볼 수 있어요. 상품을 예약하거나 관심 가게를 저장할 때 로그인을 안내해 드려요.",
  },
  {
    question: "예약한 상품은 어떻게 받나요?",
    answer:
      "상품에 표시된 예약 마감 시간을 확인하고 예약한 뒤 가게에 방문해 준비된 상품을 받으면 돼요. 예약 상태와 상세 내용은 내 예약에서 확인할 수 있어요.",
  },
  {
    question: "가게를 등록하려면 별도 계정이 필요한가요?",
    answer:
      "아니요. 일반 회원 계정으로 가게를 등록하면 고객 기능은 그대로 이용하면서 가게 관리 기능이 추가돼요.",
  },
  {
    question: "가게에서는 어떤 정보를 관리할 수 있나요?",
    answer:
      "가게 정보와 할인 품목, 판매 수량, 예약 및 픽업 상태를 한곳에서 확인하고 관리할 수 있어요.",
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
    <header className="border-hairline bg-customer-canvas/95 sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg"
          aria-label="남았당 홈"
        >
          <img
            src="/brand/namatdang-logo.png"
            width="2048"
            height="768"
            className="h-8 w-auto"
            alt="남았당"
          />
        </Link>

        <nav aria-label="남았당 주요 메뉴" className="flex items-center gap-1">
          {!isAuthenticated ? (
            <Button asChild variant="ghost" size="compact">
              <Link to="/login">로그인</Link>
            </Button>
          ) : null}
          <Button asChild variant="low" size="compact">
            <Link
              to="/app"
              aria-label={isAuthenticated ? "서비스로 이동" : "할인 둘러보기"}
            >
              <span className="sm:hidden">
                {isAuthenticated ? "서비스로" : "할인 보기"}
              </span>
              <span className="hidden sm:inline">
                {isAuthenticated ? "서비스로 이동" : "할인 둘러보기"}
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="border-hairline bg-customer-canvas border-b">
      <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <p className="text-brand-link mb-4 text-sm font-semibold">
            동네 마감 할인 예약·픽업
          </p>
          <h1
            data-route-heading
            tabIndex={-1}
            className="text-brand-brown text-4xl leading-[1.2] font-bold tracking-[-0.01em] text-balance sm:text-5xl"
          >
            오늘 남은 빵,
            <br />
            가까이서 예약해요.
          </h1>
          <p className="text-muted mt-5 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
            동네 가게가 공개한 할인 품목을 가격과 남은 수량, 예약 마감 시간까지
            확인하고 매장에서 픽업하세요.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-12 px-6 text-base">
              <Link to="/app">
                오늘 할인 상품 보기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="min-h-12 px-6 text-base"
            >
              <Link to="/map">
                지도에서 가까운 가게 찾기
                <MapPin aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <p className="text-muted mt-5 flex items-start gap-2 text-sm leading-6">
            <Check
              aria-hidden="true"
              className="text-success mt-0.5 shrink-0"
              size={18}
            />
            회원가입 전에 할인 목록과 지도를 먼저 둘러볼 수 있어요.
          </p>
        </div>
      </div>
    </section>
  )
}

function LiveDealGrid({ deals }: { deals: SellingDealDto[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {deals.map((deal) => (
        <DealCard key={deal.dealId} deal={deal} />
      ))}
    </div>
  )
}

function LiveDealsSection() {
  const dealsQuery = useQuery({
    ...sellingDealsQueryOptions({ page: 0, size: 4 }),
    retry: false,
  })
  const deals =
    dealsQuery.data?.content
      .filter((deal) => deal.status === "SELLING")
      .slice(0, 4) ?? []

  return (
    <section
      className="bg-canvas px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby="live-deals-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2
              id="live-deals-title"
              className="text-2xl font-bold sm:text-3xl"
            >
              지금 예약 가능한 할인
            </h2>
            <p className="text-muted mt-2 text-sm leading-6 sm:text-base">
              현재 판매 중인 상품만 보여드려요.
            </p>
          </div>
          <Link
            to="/app"
            aria-label="전체 할인 둘러보기"
            className="text-brand-link inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold"
          >
            <span className="sm:hidden">전체 보기</span>
            <span className="hidden sm:inline">전체 할인 둘러보기</span>
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>

        {dealsQuery.isPending ? (
          <DealGridSkeleton count={4} />
        ) : dealsQuery.isError ? (
          <div
            role="alert"
            className="border-hairline bg-surface flex min-h-40 flex-col items-start justify-center rounded-2xl border px-5 py-7 sm:px-7"
          >
            <h3 className="font-semibold">할인 상품을 불러오지 못했어요</h3>
            <p className="text-muted mt-2 text-sm leading-6">
              잠시 후 다시 시도해 주세요.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="compact"
              className="mt-5"
              onClick={() => void dealsQuery.refetch()}
            >
              다시 불러오기
            </Button>
          </div>
        ) : deals.length === 0 ? (
          <div
            role="status"
            className="border-hairline bg-surface flex min-h-40 flex-col items-start justify-center rounded-2xl border px-5 py-7 sm:px-7"
          >
            <h3 className="font-semibold">지금 공개된 할인 상품이 없어요</h3>
            <p className="text-muted mt-2 text-sm leading-6">
              새로운 할인이 올라오면 이곳에서 바로 확인할 수 있어요.
            </p>
          </div>
        ) : (
          <LiveDealGrid deals={deals} />
        )}
      </div>
    </section>
  )
}

function DealInformationSection() {
  return (
    <section
      className="border-hairline bg-customer-canvas border-y px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="deal-information-title"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-20">
        <div className="max-w-xl">
          <p className="text-brand-link text-sm font-semibold">
            예약을 결정하기 전에
          </p>
          <h2
            id="deal-information-title"
            className="text-brand-brown mt-3 text-2xl leading-tight font-bold sm:text-4xl"
          >
            필요한 정보부터 한눈에 확인해요
          </h2>
          <p className="text-muted mt-3 leading-7">
            상품마다 실제 예약에 필요한 내용을 같은 순서로 보여드려 비교하기
            쉬워요.
          </p>
        </div>

        <ul className="border-hairline grid border-y sm:grid-cols-2">
          {dealInformation.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className={`flex gap-4 py-5 sm:px-6 ${
                index > 0 ? "border-hairline border-t" : ""
              } ${
                index === 1 ? "sm:border-t-0 sm:border-l" : ""
              } ${index === 2 ? "sm:border-t" : ""} ${
                index === 3 ? "sm:border-l" : ""
              }`}
            >
              <span className="bg-brand-tint text-brand-brown inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Icon aria-hidden="true" size={21} />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-muted mt-1 text-sm leading-6">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function JourneySection() {
  return (
    <section
      id="how-it-works"
      className="bg-canvas scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="journey-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 id="journey-title" className="text-2xl font-bold sm:text-4xl">
            할인 찾기부터 픽업까지
          </h2>
          <p className="text-muted mt-3 leading-7">
            세 단계만 기억하면 돼요. 필요한 정보는 각 화면에서 다시 확인할 수
            있어요.
          </p>
        </div>

        <ol className="border-hairline mt-9 grid border-y md:grid-cols-3">
          {journeySteps.map(({ title, description, icon: Icon }, index) => (
            <li
              key={title}
              className={`flex gap-4 py-7 md:px-7 ${
                index > 0
                  ? "border-hairline border-t md:border-t-0 md:border-l"
                  : ""
              }`}
            >
              <span className="bg-brand-tint text-brand-brown inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Icon aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-muted text-xs font-semibold">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-bold">{title}</h3>
                <p className="text-muted mt-2 text-sm leading-6">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function StoreOwnerSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      id="for-stores"
      className="bg-bread-cream scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="store-owner-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20">
        <div className="max-w-2xl">
          <p className="text-brand-link text-sm font-semibold">
            가게 운영자라면
          </p>
          <h2
            id="store-owner-title"
            className="text-brand-brown mt-3 text-2xl leading-tight font-bold sm:text-4xl"
          >
            오늘 남은 상품을 직접 공개하세요
          </h2>
          <p className="text-muted mt-4 leading-7">
            가게와 할인 품목을 등록하고 들어온 예약과 픽업 상태를 관리할 수
            있어요. 별도 사장님 계정 없이 기존 회원 계정에 관리 기능이 추가돼요.
          </p>
          <Button asChild className="mt-7 min-h-12 px-6 text-base">
            <Link
              to={
                isAuthenticated
                  ? "/manage/onboarding"
                  : "/login?redirect=%2Fmanage%2Fonboarding"
              }
            >
              가게 등록하기
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="border-brand-brown/15 border-y">
          {[
            { icon: Store, text: "가게 기본 정보와 운영 안내 관리" },
            { icon: Clock3, text: "할인 품목·판매 수량·예약 마감 등록" },
            { icon: PackageCheck, text: "예약 확인부터 픽업 완료까지 관리" },
          ].map(({ icon: Icon, text }, index) => (
            <li
              key={text}
              className={`flex min-h-16 items-center gap-4 py-4 ${
                index > 0 ? "border-brand-brown/15 border-t" : ""
              }`}
            >
              <Icon aria-hidden="true" className="text-brand-brown" size={21} />
              <span className="font-medium">{text}</span>
              <Check
                aria-hidden="true"
                className="text-success ml-auto shrink-0"
                size={19}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section
      id="faq"
      className="bg-canvas scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <h2 id="faq-title" className="text-2xl font-bold sm:text-4xl">
            자주 묻는 질문
          </h2>
          <p className="text-muted mt-3 leading-7">
            남았당을 이용하기 전에 궁금한 내용을 확인해 보세요.
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
                    className="transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                    size={18}
                  />
                </span>
              </summary>
              <p className="text-muted max-w-2xl pr-10 pb-6 text-sm leading-7 sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCustomerCallToAction() {
  return (
    <section
      className="border-hairline bg-customer-canvas border-t px-4 py-12 sm:px-6 sm:py-14 lg:px-8"
      aria-labelledby="final-customer-cta-title"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <h2
            id="final-customer-cta-title"
            className="text-brand-brown text-2xl leading-tight font-bold sm:text-3xl"
          >
            오늘 가까운 가게의 할인을 확인해 보세요
          </h2>
          <p className="text-muted mt-2 leading-7">
            로그인하지 않아도 판매 중인 상품부터 둘러볼 수 있어요.
          </p>
        </div>
        <Button asChild className="min-h-12 w-full px-6 text-base sm:w-auto">
          <Link to="/app">
            할인 상품 보기
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="border-hairline bg-customer-canvas border-t px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <img
            src="/brand/namatdang-logo.png"
            width="2048"
            height="768"
            className="h-8 w-auto"
            alt="남았당"
          />
          <p className="text-muted mt-3 text-sm">
            동네 마감 상품을 예약하고 매장에서 픽업해요.
          </p>
        </div>
        <nav aria-label="하단 메뉴" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link
            to="/app"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm font-medium"
          >
            할인 둘러보기
          </Link>
          <Link
            to="/map"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm font-medium"
          >
            지도로 찾기
          </Link>
          <a
            href="#for-stores"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm font-medium"
          >
            사장님 안내
          </a>
          <a
            href="#faq"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm font-medium"
          >
            자주 묻는 질문
          </a>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  useDocumentTitle("동네 마감 할인 예약·픽업")
  const isAuthenticated = useAuthenticationState()

  return (
    <div className="bg-customer-canvas text-foreground min-h-svh overflow-x-clip">
      <LandingHeader isAuthenticated={isAuthenticated} />
      <main id="main-content">
        <HeroSection />
        <LiveDealsSection />
        <DealInformationSection />
        <JourneySection />
        <StoreOwnerSection isAuthenticated={isAuthenticated} />
        <FaqSection />
        <FinalCustomerCallToAction />
      </main>
      <LandingFooter />
    </div>
  )
}
