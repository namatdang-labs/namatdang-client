import { useEffect, useState } from "react"
import {
  ArrowRight,
  BadgePercent,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  MapPin,
  Package,
  PackageCheck,
  Search,
  Store,
  Tags,
} from "lucide-react"
import { Link } from "react-router"

import cityMapImage from "../../assets/landing/city-map.webp"
import croissantImage from "../../assets/landing/croissant.webp"
import dessertBoxImage from "../../assets/landing/dessert-box.webp"
import heroBakeryImage from "../../assets/landing/hero-bakery.webp"
import saltBreadImage from "../../assets/landing/salt-bread.webp"
import {
  getAccessToken,
  hasUsableAccessToken,
} from "../../features/auth/auth-session"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const featuredDeals = [
  {
    name: "소금빵 3개 세트",
    store: "동성로 베이크샵",
    image: saltBreadImage,
    imageAlt: "소금빵 3개 세트 사진",
    discountRate: 30,
    originalPrice: "8,400원",
    salePrice: "5,900원",
    remaining: "4개 남음",
    deadline: "오늘 19:30",
  },
  {
    name: "크루아상·뺑 오 쇼콜라 세트",
    store: "수성못 브레드",
    image: croissantImage,
    imageAlt: "크루아상 2개와 뺑 오 쇼콜라 사진",
    discountRate: 30,
    originalPrice: "9,000원",
    salePrice: "6,300원",
    remaining: "3개 남음",
    deadline: "오늘 20:00",
  },
  {
    name: "오늘의 디저트 모음 박스",
    store: "앞산 과자점",
    image: dessertBoxImage,
    imageAlt: "디저트 모음 박스 사진",
    discountRate: 35,
    originalPrice: "18,000원",
    salePrice: "11,700원",
    remaining: "2개 남음",
    deadline: "오늘 20:30",
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

function ownerOnboardingPath(isAuthenticated: boolean) {
  return isAuthenticated
    ? "/manage/onboarding"
    : "/login?redirect=%2Fmanage%2Fonboarding"
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

function HeroProductSurface() {
  return (
    <div className="relative min-h-[420px] min-w-0 sm:min-h-[520px] lg:min-h-[560px]">
      <div className="bg-bread-cream absolute top-5 right-0 h-[76%] w-[92%] rounded-[2rem] sm:h-[82%] sm:w-[88%]">
        <img
          src={heroBakeryImage}
          alt="빵과 디저트가 진열된 동네 베이커리"
          width="1600"
          height="845"
          fetchPriority="high"
          className="h-full w-full rounded-[2rem] object-cover"
        />
      </div>

      <div className="border-hairline bg-canvas absolute right-3 bottom-0 left-3 overflow-hidden rounded-2xl border shadow-[0_20px_45px_rgba(78,36,16,0.14)] sm:right-auto sm:left-0 sm:w-[390px]">
        <div className="border-hairline flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-muted text-[11px]">내 동네</p>
            <p className="text-brand-brown mt-0.5 flex items-center gap-1 text-sm font-bold">
              <MapPin aria-hidden="true" size={15} />
              <span className="truncate">동성로2가 · 변경</span>
            </p>
          </div>
          <span className="bg-surface text-muted inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Search aria-hidden="true" size={18} />
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold">지금 예약 가능한 할인</p>
            <span className="text-brand-link text-xs font-bold">전체 보기</span>
          </div>
          <article className="mt-3 grid grid-cols-[88px_minmax(0,1fr)] gap-3">
            <img
              src={saltBreadImage}
              alt="소금빵 3개 세트"
              width="900"
              height="900"
              className="h-[108px] w-[88px] rounded-xl object-cover"
            />
            <div className="min-w-0 py-0.5">
              <p className="text-muted truncate text-xs">동성로 베이크샵</p>
              <h2 className="mt-1 truncate text-sm font-bold">
                소금빵 3개 세트
              </h2>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-brand-link text-sm font-bold">30%</span>
                <strong className="text-base tabular-nums">5,900원</strong>
                <del className="text-muted text-[11px] tabular-nums">
                  8,400원
                </del>
              </div>
              <p className="text-muted mt-2 flex items-center gap-1 text-xs">
                <Clock3 aria-hidden="true" size={14} />
                오늘 19:30까지 · 4개 남음
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="bg-primary text-primary-foreground absolute top-0 left-0 hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm sm:flex">
        <BadgePercent aria-hidden="true" size={18} />
        오늘 가까운 할인
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section
      className="bg-customer-canvas relative overflow-hidden"
      aria-labelledby="landing-hero-title"
    >
      <div className="bg-bread-cream/60 absolute -top-36 -left-32 size-80 rounded-full blur-3xl" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(500px,1.14fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-16">
        <div className="relative z-10 max-w-xl">
          <p className="text-brand-link text-sm font-bold">
            동네 마감 할인 예약·픽업
          </p>
          <h1
            id="landing-hero-title"
            data-route-heading
            tabIndex={-1}
            className="text-brand-brown mt-4 text-4xl leading-[1.25] font-bold tracking-[-0.01em] text-balance break-keep sm:text-5xl lg:text-[3.5rem]"
          >
            오늘 남은 빵,
            <br />
            가까이서 예약해요.
          </h1>
          <p className="text-muted mt-5 max-w-lg text-base leading-7 break-keep sm:text-lg sm:leading-8">
            동네 가게의 할인 상품을 사진으로 둘러보고 가격, 남은 수량, 예약 마감
            시간을 확인한 뒤 예약하고 매장에서 픽업하세요.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="px-6 text-base font-bold">
              <Link to="/app">
                오늘 할인 상품 보기
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="px-6 text-base font-bold"
            >
              <Link to="/map">
                지도에서 가까운 가게 찾기
                <MapPin aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <HeroProductSurface />
      </div>
    </section>
  )
}

function DiscountShowcase() {
  return (
    <section
      className="border-hairline bg-canvas border-y px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="discount-showcase-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-brand-link text-sm font-bold">오늘의 할인</p>
          <h2
            id="discount-showcase-title"
            className="text-brand-brown mt-3 text-3xl leading-[1.3] font-bold text-balance break-keep sm:text-4xl"
          >
            오늘의 할인을 한눈에 골라요
          </h2>
          <p className="text-muted mt-4 leading-7 break-keep">
            상품 사진과 할인가, 남은 수량, 예약 마감 시간을 한 카드에서 비교할
            수 있어요.
          </p>
        </div>

        <div className="mt-10 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredDeals.map((deal) => (
            <article
              key={deal.name}
              className="border-hairline bg-canvas min-w-0 overflow-hidden rounded-2xl border"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={deal.image}
                  alt={deal.imageAlt}
                  width="900"
                  height="900"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="bg-primary text-primary-foreground absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold">
                  <BadgePercent aria-hidden="true" size={15} />
                  판매 중
                </span>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-muted flex items-center gap-1.5 text-sm">
                  <Store aria-hidden="true" size={16} />
                  <span className="truncate">{deal.store}</span>
                </p>
                <h3 className="mt-2 truncate text-lg font-bold">{deal.name}</h3>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                  <span className="text-brand-link font-bold tabular-nums">
                    {deal.discountRate}%
                  </span>
                  <strong className="text-xl tabular-nums">
                    {deal.salePrice}
                  </strong>
                  <del className="text-muted text-sm tabular-nums">
                    {deal.originalPrice}
                  </del>
                </div>
                <dl className="border-hairline mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs">
                      <PackageCheck aria-hidden="true" size={15} />
                      남은 수량
                    </dt>
                    <dd className="mt-1 font-bold tabular-nums">
                      {deal.remaining}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted flex items-center gap-1.5 text-xs">
                      <Clock3 aria-hidden="true" size={15} />
                      예약 마감
                    </dt>
                    <dd className="mt-1 font-bold tabular-nums">
                      {deal.deadline}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function BrandedMapPin({
  className,
  label,
  selected = false,
  hasDeal = true,
}: {
  className: string
  label: string
  selected?: boolean
  hasDeal?: boolean
}) {
  return (
    <span
      className={`absolute ${className} block leading-none`}
      style={{ transform: "translate(-45.117%, -85.156%)" }}
      role="img"
      aria-label={label}
      data-deal-status={hasDeal ? "active" : "none"}
      data-selected={String(selected)}
    >
      <img
        src="/brand/namatdang-icon.png"
        alt=""
        draggable={false}
        className={`block object-contain ${
          selected ? "size-14" : "size-12"
        } ${hasDeal ? "" : "opacity-[0.68] grayscale"}`}
      />
    </span>
  )
}

function MapShowcase() {
  return (
    <section
      className="bg-bread-cream px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="map-showcase-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(520px,1.28fr)] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="text-brand-link text-sm font-bold">지도에서 찾기</p>
          <h2
            id="map-showcase-title"
            className="text-brand-brown mt-3 text-3xl leading-[1.3] font-bold text-balance break-keep sm:text-4xl"
          >
            가까운 할인 가게를 지도에서 찾아요
          </h2>
          <p className="text-muted mt-4 leading-7 break-keep">
            원하는 동네로 지도를 옮기면 할인 중인 가게를 바로 확인하고, 핀을
            선택해 가게와 상품 정보를 이어서 볼 수 있어요.
          </p>
          <Button
            asChild
            variant="secondary"
            className="mt-7 px-6 text-base font-bold"
          >
            <Link to="/map">
              지도로 할인 가게 찾기
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="border-brand-brown/10 bg-canvas overflow-hidden rounded-3xl border shadow-[0_22px_55px_rgba(78,36,16,0.12)]">
          <div className="border-hairline flex items-center gap-3 border-b p-3 sm:p-4">
            <span className="bg-surface text-muted flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-sm">
              <Search aria-hidden="true" size={18} />
              <span className="truncate">대구 가게·할인 품목 검색</span>
            </span>
            <span className="bg-brand-tint text-brand-brown hidden min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-bold sm:inline-flex">
              이 위치에서 검색
            </span>
          </div>

          <div className="relative h-[430px] overflow-hidden sm:h-[500px]">
            <img
              src={cityMapImage}
              alt="대구 동성로 주변 가게 지도"
              width="1400"
              height="876"
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <ul className="bg-canvas/95 text-muted absolute top-3 left-3 flex items-center gap-3 rounded-full px-3 py-2 text-xs shadow-sm">
              <li className="flex items-center gap-1.5">
                <span className="bg-primary size-2.5 rounded-full" />
                할인 중
              </li>
              <li className="flex items-center gap-1.5">
                <span className="bg-muted size-2.5 rounded-full" />
                일반 가게
              </li>
            </ul>

            <BrandedMapPin
              className="top-[34%] left-[26%]"
              label="수성못 브레드, 현재 공개된 할인 없음"
              hasDeal={false}
            />
            <BrandedMapPin
              className="top-[48%] left-[62%]"
              label="동성로 베이크샵, 할인 중, 선택됨"
              selected
            />
            <BrandedMapPin
              className="top-[28%] left-[78%]"
              label="앞산 과자점, 할인 중"
            />

            <article className="border-hairline bg-canvas absolute right-3 bottom-3 left-3 grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border p-3 shadow-[0_12px_32px_rgba(33,33,36,0.16)] sm:right-auto sm:bottom-5 sm:left-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:grid-cols-[84px_minmax(0,1fr)] sm:p-4">
              <img
                src={saltBreadImage}
                alt="동성로 베이크샵 소금빵"
                width="900"
                height="900"
                loading="lazy"
                className="h-full min-h-[88px] w-[72px] rounded-xl object-cover sm:w-[84px]"
              />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">동성로 베이크샵</h3>
                    <p className="text-muted mt-1 truncate text-xs">
                      대구 중구 동성로2길 28
                    </p>
                  </div>
                  <span className="bg-brand-tint text-brand-link shrink-0 rounded-full px-2 py-1 text-[11px] font-bold">
                    할인 중
                  </span>
                </div>
                <p className="text-foreground mt-2 truncate text-sm font-bold">
                  소금빵 3개 세트 · 5,900원
                </p>
                <div className="text-muted mt-1 flex items-center justify-between gap-2 text-xs">
                  <span>2개 판매 중</span>
                  <span className="text-brand-link flex shrink-0 items-center font-bold">
                    가게 정보 보기
                    <ChevronRight aria-hidden="true" size={14} />
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReservationShowcase() {
  return (
    <section
      className="border-hairline bg-customer-canvas border-y px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="reservation-showcase-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(480px,1.08fr)_minmax(0,0.92fr)] lg:items-center lg:gap-20">
        <div className="border-hairline bg-canvas order-2 mx-auto w-full max-w-xl overflow-hidden rounded-3xl border lg:order-1">
          <div className="border-hairline flex min-h-16 items-center justify-between gap-3 border-b px-4 sm:px-6">
            <div>
              <p className="text-muted text-xs">예약 내용 확인</p>
              <h3 className="mt-0.5 font-bold">동성로 베이크샵</h3>
            </div>
            <span className="bg-brand-tint text-brand-brown rounded-full px-3 py-1.5 text-xs font-bold">
              예약 전 확인
            </span>
          </div>

          <div className="p-4 sm:p-6">
            <article className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
              <img
                src={saltBreadImage}
                alt="예약한 소금빵 3개 세트"
                width="900"
                height="900"
                loading="lazy"
                className="size-[88px] rounded-xl object-cover"
              />
              <div className="min-w-0 py-1">
                <h3 className="truncate font-bold">소금빵 3개 세트</h3>
                <p className="text-muted mt-1 text-sm">수량 1개</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <strong className="text-lg tabular-nums">5,900원</strong>
                  <del className="text-muted text-xs tabular-nums">8,400원</del>
                </div>
              </div>
            </article>

            <dl className="border-hairline mt-5 grid gap-4 border-y py-5 sm:grid-cols-2">
              <div>
                <dt className="text-muted flex items-center gap-2 text-xs">
                  <Clock3 aria-hidden="true" size={17} />
                  예약 마감
                </dt>
                <dd className="mt-2 font-bold">오늘 19:30</dd>
              </div>
              <div>
                <dt className="text-muted flex items-center gap-2 text-xs">
                  <MapPin aria-hidden="true" size={17} />
                  픽업 장소
                </dt>
                <dd className="mt-2 font-bold">동성로 베이크샵</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-muted text-xs">총 예약 금액</p>
                <strong className="text-brand-brown mt-1 block text-2xl tabular-nums">
                  5,900원
                </strong>
              </div>
              <span className="bg-primary text-primary-foreground inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold">
                예약하기
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 max-w-xl lg:order-2">
          <p className="text-brand-link text-sm font-bold">간편한 예약</p>
          <h2
            id="reservation-showcase-title"
            className="text-brand-brown mt-3 text-3xl leading-[1.3] font-bold text-balance break-keep sm:text-4xl"
          >
            품목과 수량, 금액을 한 번 더 확인해요
          </h2>
          <p className="text-muted mt-4 leading-7 break-keep">
            선택한 상품과 수량, 최종 금액, 방문할 가게와 예약 마감 시각을 확인한
            뒤 예약을 마칠 수 있어요.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="bg-brand-tint text-brand-link flex size-8 shrink-0 items-center justify-center rounded-full">
                <Check aria-hidden="true" size={17} />
              </span>
              최종 할인가와 수량을 예약 전에 확인
            </li>
            <li className="flex items-center gap-3">
              <span className="bg-brand-tint text-brand-link flex size-8 shrink-0 items-center justify-center rounded-full">
                <Check aria-hidden="true" size={17} />
              </span>
              가게 주소와 예약 마감 시각을 함께 안내
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

const managementSummary = [
  { label: "픽업 대기", value: "6건", icon: CalendarClock },
  { label: "판매 중 할인", value: "3개", icon: Tags },
  { label: "공개 품목", value: "12개", icon: Package },
  { label: "예약 금액", value: "47,800원", icon: CircleDollarSign },
] as const

function ManagementDashboardSurface() {
  return (
    <div className="border-brand-brown/10 bg-background overflow-hidden rounded-3xl border shadow-[0_22px_55px_rgba(78,36,16,0.12)]">
      <div className="border-hairline bg-canvas flex min-h-16 items-center justify-between gap-3 border-b px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src="/brand/namatdang-icon.png"
            alt=""
            className="size-9 shrink-0 rounded-lg"
          />
          <div className="min-w-0">
            <p className="text-muted text-[11px]">현재 관리 중</p>
            <p className="truncate text-sm font-bold">동성로 베이크샵</p>
          </div>
        </div>
        <span className="bg-primary text-primary-foreground hidden min-h-10 items-center rounded-xl px-4 text-sm font-bold sm:inline-flex">
          할인 등록
        </span>
      </div>

      <div className="sm:grid sm:grid-cols-[148px_minmax(0,1fr)]">
        <aside className="border-hairline bg-canvas hidden border-r p-3 sm:block">
          <ul className="grid gap-1 text-xs">
            {[
              { label: "운영 현황", icon: LayoutDashboard, active: true },
              { label: "할인 관리", icon: Tags, active: false },
              { label: "예약 관리", icon: CalendarClock, active: false },
              { label: "가게 정보", icon: Store, active: false },
            ].map(({ label, icon: Icon, active }) => (
              <li
                key={label}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-2.5 font-bold ${
                  active ? "bg-brand-tint text-brand-brown" : "text-muted"
                }`}
              >
                <Icon aria-hidden="true" size={16} />
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-muted text-[11px]">8월 21일 금요일</p>
              <h3 className="mt-1 text-lg font-bold">오늘 운영 현황</h3>
            </div>
            <span className="text-brand-link hidden text-xs font-bold sm:inline">
              예약 관리
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {managementSummary.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="border-hairline bg-canvas min-w-0 rounded-xl border p-3"
              >
                <dt className="text-muted flex items-center gap-1.5 truncate text-[10px] sm:text-[11px]">
                  <Icon aria-hidden="true" size={14} />
                  {label}
                </dt>
                <dd className="mt-1.5 truncate text-sm font-bold tabular-nums sm:text-base">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="border-hairline bg-canvas rounded-xl border p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold">픽업 대기 예약</h4>
                <span className="text-warning bg-brand-tint rounded-full px-2 py-1 text-[10px] font-bold">
                  6건
                </span>
              </div>
              <ul className="divide-hairline mt-2 divide-y text-xs">
                <li className="flex items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <strong className="block truncate">소금빵 3개 세트</strong>
                    <span className="text-muted mt-0.5 block truncate">
                      오늘 17:40 접수 · 5,900원
                    </span>
                  </span>
                  <span className="text-warning shrink-0 font-bold">
                    픽업 대기
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <strong className="block truncate">
                      크루아상·뺑 오 쇼콜라
                    </strong>
                    <span className="text-muted mt-0.5 block truncate">
                      오늘 17:52 접수 · 6,300원
                    </span>
                  </span>
                  <span className="text-warning shrink-0 font-bold">
                    픽업 대기
                  </span>
                </li>
              </ul>
            </section>

            <section className="border-hairline bg-canvas rounded-xl border p-3.5">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold">선택한 예약</h4>
                <span className="text-warning bg-brand-tint rounded-full px-2 py-1 text-[10px] font-bold">
                  픽업 대기
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">예약 품목</dt>
                  <dd className="truncate font-bold">소금빵 3개 세트</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">예약 금액</dt>
                  <dd className="font-bold tabular-nums">5,900원</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">접수 시각</dt>
                  <dd className="font-bold tabular-nums">오늘 17:40</dd>
                </div>
              </dl>
              <span className="bg-primary text-primary-foreground mt-3 flex min-h-10 items-center justify-center rounded-lg text-xs font-bold">
                픽업 완료
              </span>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function StoreOwnerSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      className="bg-canvas px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="store-owner-title"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.76fr)_minmax(600px,1.24fr)] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="text-brand-link text-sm font-bold">가게 운영자라면</p>
          <h2
            id="store-owner-title"
            className="text-brand-brown mt-3 text-3xl leading-[1.3] font-bold text-balance break-keep sm:text-4xl"
          >
            오늘 남은 상품을 직접 공개하세요
          </h2>
          <p className="text-muted mt-4 leading-7 break-keep">
            할인 품목과 판매 수량, 예약 마감을 등록하고 들어온 예약부터 픽업
            완료까지 한 화면에서 관리할 수 있어요.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            <li className="flex items-center gap-3">
              <Package
                className="text-brand-link"
                aria-hidden="true"
                size={19}
              />
              남은 품목과 판매 수량을 빠르게 공개
            </li>
            <li className="flex items-center gap-3">
              <PackageCheck
                className="text-brand-link"
                aria-hidden="true"
                size={19}
              />
              예약 접수와 픽업 상태를 한곳에서 확인
            </li>
          </ul>
          <Button asChild className="mt-7 px-6 text-base font-bold">
            <Link to={ownerOnboardingPath(isAuthenticated)}>
              가게 등록하기
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ManagementDashboardSurface />
      </div>
    </section>
  )
}

function FinalCustomerCallToAction() {
  return (
    <section
      className="bg-bread-cream px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby="final-customer-cta-title"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <p className="text-brand-link text-sm font-bold">오늘의 동네 할인</p>
          <h2
            id="final-customer-cta-title"
            className="text-brand-brown mt-2 text-3xl leading-[1.3] font-bold text-balance break-keep sm:text-4xl"
          >
            오늘 가까운 가게의 할인을 확인해 보세요
          </h2>
          <p className="text-muted mt-3 leading-7">
            로그인하지 않아도 판매 중인 상품부터 둘러볼 수 있어요.
          </p>
        </div>
        <Button asChild className="w-full px-6 text-base font-bold sm:w-auto">
          <Link to="/app">
            할인 상품 보기
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

function LandingFooter({ isAuthenticated }: { isAuthenticated: boolean }) {
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
        <nav aria-label="하단 메뉴" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link
            to="/app"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm"
          >
            할인 둘러보기
          </Link>
          <Link
            to="/map"
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm"
          >
            지도로 찾기
          </Link>
          <Link
            to={ownerOnboardingPath(isAuthenticated)}
            className="text-muted hover:text-foreground inline-flex min-h-11 items-center text-sm"
          >
            가게 등록하기
          </Link>
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
        <DiscountShowcase />
        <MapShowcase />
        <ReservationShowcase />
        <StoreOwnerSection isAuthenticated={isAuthenticated} />
        <FinalCustomerCallToAction />
      </main>
      <LandingFooter isAuthenticated={isAuthenticated} />
    </div>
  )
}
