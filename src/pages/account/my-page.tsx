import {
  CalendarCheck2,
  ChevronRight,
  Heart,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react"
import { Link } from "react-router"

import { stores as customerStores } from "../../features/customer/customer-data"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { getReservationsByUserId, mockUser } from "../../shared/mock"
import type { UserRole } from "../../shared/types"
import { Button } from "../../shared/ui/button"

const roleLabels: Record<UserRole, string> = {
  ROLE_USER: "일반 회원",
  ROLE_OWNER: "가게 관리자",
}

const managementEntryPath = mockUser.roles.includes("ROLE_OWNER")
  ? "/manage"
  : "/manage/onboarding"

export function MyPage() {
  const reservations = getReservationsByUserId(mockUser.id)
  const activeReservationCount = reservations.filter((reservation) =>
    ["pending", "confirmed"].includes(reservation.status),
  ).length
  const favoriteStores = customerStores.filter((store) =>
    ["seongsu-bread-lab", "mangwon-cake-room"].includes(store.id),
  )

  useDocumentTitle("마이")

  return (
    <div className="mx-auto w-full max-w-4xl py-6 sm:py-10">
      <header>
        <p className="text-brand-link text-sm font-semibold">내 남았당</p>
        <h1
          data-route-heading
          tabIndex={-1}
          className="text-foreground mt-2 text-2xl font-bold sm:text-3xl"
        >
          마이
        </h1>
        <p className="text-muted mt-2 text-sm leading-6 sm:text-base">
          회원 정보와 예약, 찜한 가게를 확인할 수 있어요.
        </p>
      </header>

      <section className="border-hairline bg-canvas mt-7 rounded-2xl border p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="bg-bread-cream text-brand-brown flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              aria-hidden="true"
            >
              {mockUser.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-xl font-bold">
                {mockUser.nickname}
              </p>
              <p className="text-muted mt-1 text-sm">{mockUser.name}님</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="보유 권한">
            {mockUser.roles.map((role, index) => (
              <span
                key={role}
                className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                  index === 0
                    ? "border-primary bg-brand-tint text-brand-brown"
                    : "border-hairline bg-surface text-foreground"
                }`}
              >
                {roleLabels[role]}
              </span>
            ))}
          </div>
        </div>

        <dl className="border-hairline mt-6 grid gap-4 border-t pt-5 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <Mail
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted">이메일</dt>
              <dd className="text-foreground mt-1 font-medium break-all">
                {mockUser.email}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone
              className="text-muted mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted">휴대폰 번호</dt>
              <dd className="text-foreground mt-1 font-medium tabular-nums">
                {mockUser.phone}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <section className="mt-5">
        <h2 className="sr-only">활동 요약</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/reservations"
            className="border-hairline bg-canvas flex min-h-28 items-center justify-between rounded-2xl border p-5"
          >
            <span className="flex items-center gap-3">
              <span
                className="bg-brand-tint text-brand-brown flex size-11 items-center justify-center rounded-xl"
                aria-hidden="true"
              >
                <CalendarCheck2 className="size-5" />
              </span>
              <span>
                <span className="text-muted block text-sm">진행 중인 예약</span>
                <span className="text-foreground mt-1 block text-xl font-bold tabular-nums">
                  {activeReservationCount}건
                </span>
              </span>
            </span>
            <ChevronRight className="text-muted size-5" aria-hidden="true" />
          </Link>

          <Link
            to="/me#favorite-stores"
            className="border-hairline bg-canvas flex min-h-28 items-center justify-between rounded-2xl border p-5"
          >
            <span className="flex items-center gap-3">
              <span
                className="bg-surface text-brand-link flex size-11 items-center justify-center rounded-xl"
                aria-hidden="true"
              >
                <Heart className="size-5" />
              </span>
              <span>
                <span className="text-muted block text-sm">찜한 가게</span>
                <span className="text-foreground mt-1 block text-xl font-bold tabular-nums">
                  {favoriteStores.length}곳
                </span>
              </span>
            </span>
            <ChevronRight className="text-muted size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section
          id="favorite-stores"
          className="border-hairline bg-canvas scroll-mt-24 rounded-2xl border p-5 sm:p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-foreground text-lg font-bold">찜한 가게</h2>
              <p className="text-muted mt-1 text-sm">
                새 할인을 다시 찾아보기 쉬워요.
              </p>
            </div>
            <Heart className="text-brand-link size-5" aria-hidden="true" />
          </div>

          <ul className="divide-hairline mt-4 divide-y">
            {favoriteStores.map((store) => (
              <li key={store.id}>
                <Link
                  to={`/stores/${store.id}`}
                  className="flex min-h-16 items-center justify-between gap-4 rounded-lg py-3"
                >
                  <span className="min-w-0">
                    <span className="text-foreground block truncate font-semibold">
                      {store.name}
                    </span>
                    <span className="text-muted mt-1 block text-sm">
                      {store.district}
                    </span>
                  </span>
                  <ChevronRight
                    className="text-muted size-5 shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-bread-cream rounded-2xl p-5 sm:p-6">
          <span
            className="bg-canvas text-brand-brown flex size-11 items-center justify-center rounded-xl"
            aria-hidden="true"
          >
            <Store className="size-5" />
          </span>
          <h2 className="text-brand-brown mt-5 text-lg font-bold">
            내 가게 관리
          </h2>
          <p className="text-brand-brown mt-2 text-sm leading-6">
            가게 관리자 권한이 추가되어도 일반 회원 기능은 그대로 사용할 수
            있어요.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to={managementEntryPath}>
              가게 관리로 이동
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </div>

      <section className="border-hairline bg-canvas mt-5 rounded-2xl border p-5 sm:p-6">
        <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="size-5" aria-hidden="true" />
          계정 권한 안내
        </h2>
        <p className="text-muted mt-2 text-sm leading-6">
          모든 회원은 일반 회원 권한을 기본으로 가지고, 가게를 등록하면 가게
          관리자 권한이 함께 추가돼요.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <UserRound className="text-muted size-5" aria-hidden="true" />
          <span className="text-foreground font-medium">
            현재 일반 회원·가게 관리자 기능을 모두 사용할 수 있어요.
          </span>
        </div>
      </section>
    </div>
  )
}
