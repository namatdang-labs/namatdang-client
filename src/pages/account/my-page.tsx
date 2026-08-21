import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheck2,
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react"
import { Link, useNavigate } from "react-router"

import {
  currentUserQueryOptions,
  deleteCurrentUser,
  updateCurrentUser,
  type CurrentUser,
} from "../../features/account/account-api"
import { clearAccessToken } from "../../features/auth/auth-session"
import {
  favoriteStoresQueryOptions,
  reservationsQueryOptions,
} from "../../features/customer/customer-api"
import { ApiError } from "../../shared/api/client"
import {
  formatKoreanPhoneNumber,
  handlePhoneNumberChange,
} from "../../shared/lib/phone-number"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const profileInputClass =
  "border-hairline bg-canvas text-foreground placeholder:text-disabled min-h-12 w-full rounded-xl border px-4 text-base transition-colors focus:border-foreground disabled:bg-surface disabled:text-disabled aria-[invalid=true]:border-critical aria-[invalid=true]:border-2"

type ProfileValues = {
  name: string
  phoneNumber: string
}

type ProfileErrors = Partial<Record<keyof ProfileValues, string>>

function getApiErrorCode(error: unknown) {
  if (!(error instanceof ApiError) || typeof error.payload !== "object") {
    return null
  }

  const payload = error.payload as { code?: unknown }
  return typeof payload.code === "string" ? payload.code : null
}

function getProfileSaveErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 400) {
    return "이름과 전화번호 형식을 확인해 주세요."
  }

  return "회원 정보를 저장하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요."
}

function getDeleteAccountErrorMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 409 &&
    getApiErrorCode(error) === "OWNER_HAS_STORES"
  ) {
    return "등록한 가게가 있어 탈퇴할 수 없어요. 가게 정리를 위해 운영팀에 문의해 주세요."
  }

  return "회원 탈퇴를 완료하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요."
}

export function MyPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const userQuery = useQuery(currentUserQueryOptions())
  const favoritesQuery = useQuery(favoriteStoresQueryOptions())
  const reservationsQuery = useQuery(reservationsQueryOptions({ size: 1 }))
  const favoriteStores = favoritesQuery.data ?? []
  const user = userQuery.data
  const hasOwnerRole = user?.roles.includes("OWNER") ?? false
  const roleLabels = hasOwnerRole ? ["일반 회원", "가게 관리자"] : ["일반 회원"]
  const deleteAccountMutation = useMutation({
    mutationFn: deleteCurrentUser,
    onSuccess: () => {
      clearAccessToken()
      queryClient.clear()
      void navigate("/", { replace: true })
    },
  })

  useDocumentTitle("마이")

  const logout = () => {
    clearAccessToken()
    queryClient.clear()
    void navigate("/login", { replace: true })
  }

  const openDeleteDialog = () => {
    deleteAccountMutation.reset()
    setIsDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (deleteAccountMutation.isPending) return

    deleteAccountMutation.reset()
    setIsDeleteDialogOpen(false)
  }

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

      {userQuery.isPending ? (
        <p className="text-muted mt-7 text-sm" role="status">
          회원 정보를 불러오는 중이에요.
        </p>
      ) : null}

      {userQuery.isError ? (
        <p
          className="border-critical/30 bg-critical/5 text-critical mt-7 rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          회원 정보를 불러오지 못했어요. 다시 로그인해 주세요.
        </p>
      ) : null}

      {user ? (
        <section className="border-hairline bg-canvas mt-7 rounded-2xl border p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="bg-bread-cream text-brand-brown flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                aria-hidden="true"
              >
                {user.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <p className="text-foreground text-xl font-bold">{user.name}</p>
                <p className="text-muted mt-1 text-sm">남았당 회원</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="보유 권한">
              {roleLabels.map((role, index) => (
                <span
                  key={role}
                  className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                    index === 0
                      ? "border-primary bg-brand-tint text-brand-brown"
                      : "border-hairline bg-surface text-foreground"
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <ProfileForm user={user} />
          <div className="border-hairline mt-5 flex justify-end border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              size="compact"
              onClick={logout}
            >
              <LogOut aria-hidden="true" />
              로그아웃
            </Button>
          </div>
        </section>
      ) : null}

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
                <span className="text-muted block text-sm">내 예약</span>
                <span className="text-foreground mt-1 block text-xl font-bold tabular-nums">
                  {reservationsQuery.isPending
                    ? "-"
                    : reservationsQuery.isError
                      ? "확인 필요"
                      : `${reservationsQuery.data.totalElements}건`}
                </span>
              </span>
            </span>
            <ChevronRight className="text-muted size-5" aria-hidden="true" />
          </Link>

          <Link
            to="/favorites"
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
                  {favoritesQuery.isPending
                    ? "-"
                    : `${favoriteStores.length}곳`}
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
                  to={`/stores/${store.routeId}`}
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
            <Link to="/manage/onboarding">
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
            {hasOwnerRole
              ? "현재 일반 회원·가게 관리자 기능을 모두 사용할 수 있어요."
              : "가게를 등록하면 일반 회원 기능과 가게 관리 기능을 함께 사용할 수 있어요."}
          </span>
        </div>
      </section>

      {user ? (
        <section className="border-critical/30 bg-canvas mt-5 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground flex items-center gap-2 text-lg font-bold">
            <Trash2 className="text-critical size-5" aria-hidden="true" />
            계정 관리
          </h2>
          <p className="text-muted mt-2 text-sm leading-6">
            회원 탈퇴를 하면 계정 정보를 다시 복구할 수 없어요.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="text-critical mt-4"
            onClick={openDeleteDialog}
          >
            회원 탈퇴
          </Button>
        </section>
      ) : null}

      {isDeleteDialogOpen ? (
        <DeleteAccountDialog
          isDeleting={deleteAccountMutation.isPending}
          errorMessage={
            deleteAccountMutation.isError
              ? getDeleteAccountErrorMessage(deleteAccountMutation.error)
              : ""
          }
          onClose={closeDeleteDialog}
          onConfirm={() => deleteAccountMutation.mutate()}
        />
      ) : null}
    </div>
  )
}

function ProfileForm({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ProfileValues>(() => ({
    name: user.name,
    phoneNumber: formatKoreanPhoneNumber(user.phoneNumber),
  }))
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [successMessage, setSuccessMessage] = useState("")
  const updateMutation = useMutation({ mutationFn: updateCurrentUser })

  const isDirty =
    values.name !== user.name ||
    values.phoneNumber !== formatKoreanPhoneNumber(user.phoneNumber)

  const clearSubmissionState = (field: keyof ProfileValues) => {
    setSuccessMessage("")
    updateMutation.reset()
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors: ProfileErrors = {}
    const trimmedName = values.name.trim()

    if (!trimmedName) {
      nextErrors.name = "이름을 입력해 주세요."
    } else if (trimmedName.length > 50) {
      nextErrors.name = "이름을 50자 이하로 입력해 주세요."
    }

    if (!/^\d{2,3}-?\d{3,4}-?\d{4}$/.test(values.phoneNumber)) {
      nextErrors.phoneNumber = "전화번호 형식을 확인해 주세요."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage("")
    updateMutation.reset()

    if (!validate()) return

    try {
      const updatedUser = await updateMutation.mutateAsync({
        name: values.name.trim(),
        phoneNumber: formatKoreanPhoneNumber(values.phoneNumber),
      })
      queryClient.setQueryData(currentUserQueryOptions().queryKey, updatedUser)
      setValues({
        name: updatedUser.name,
        phoneNumber: formatKoreanPhoneNumber(updatedUser.phoneNumber),
      })
      setErrors({})
      setSuccessMessage("회원 정보를 저장했어요.")
    } catch {
      // The mutation stores the error so the form can explain how to recover.
    }
  }

  return (
    <form
      className="border-hairline mt-6 border-t pt-5"
      onSubmit={submitProfile}
      noValidate
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-foreground font-bold">회원 정보</h2>
          <p className="text-muted mt-1 text-sm leading-6">
            예약과 픽업할 때 확인할 정보예요.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
            <Mail className="text-muted size-5" aria-hidden="true" />
            이메일
          </span>
          <p className="text-muted mt-2 min-h-12 px-1 py-3 text-sm break-all">
            {user.email}
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-name"
            className="text-foreground text-sm font-semibold"
          >
            이름
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="name"
            maxLength={50}
            className={`${profileInputClass} mt-2`}
            value={values.name}
            disabled={updateMutation.isPending}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
            onChange={(event) => {
              const name = event.currentTarget.value
              clearSubmissionState("name")
              setValues((current) => ({
                ...current,
                name,
              }))
            }}
          />
          {errors.name ? (
            <p
              id="profile-name-error"
              className="text-critical mt-2 text-sm"
              role="alert"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="profile-phone-number"
            className="text-foreground flex items-center gap-2 text-sm font-semibold"
          >
            <Phone className="text-muted size-5" aria-hidden="true" />
            휴대폰 번호
          </label>
          <input
            id="profile-phone-number"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={13}
            className={`${profileInputClass} mt-2 tabular-nums`}
            value={values.phoneNumber}
            disabled={updateMutation.isPending}
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={`profile-phone-number-helper${
              errors.phoneNumber ? " profile-phone-number-error" : ""
            }`}
            onChange={(event) => {
              clearSubmissionState("phoneNumber")
              handlePhoneNumberChange(event, (formattedEvent) => {
                const phoneNumber = formattedEvent.currentTarget.value
                setValues((current) => ({
                  ...current,
                  phoneNumber,
                }))
              })
            }}
          />
          <p
            id="profile-phone-number-helper"
            className="text-muted mt-2 text-sm"
          >
            숫자만 입력하면 하이픈이 자동으로 들어가요.
          </p>
          {errors.phoneNumber ? (
            <p
              id="profile-phone-number-error"
              className="text-critical mt-2 text-sm"
              role="alert"
            >
              {errors.phoneNumber}
            </p>
          ) : null}
        </div>
      </div>

      {updateMutation.isError ? (
        <p className="text-critical mt-4 text-sm leading-6" role="alert">
          {getProfileSaveErrorMessage(updateMutation.error)}
        </p>
      ) : null}
      {successMessage ? (
        <p
          className="text-success mt-4 text-sm leading-6"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-muted text-sm sm:mr-auto" aria-live="polite">
          {isDirty ? "저장하지 않은 변경 내용이 있어요." : "저장된 정보예요."}
        </p>
        <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
          <Save aria-hidden="true" />
          {updateMutation.isPending ? "저장하는 중" : "변경 사항 저장"}
        </Button>
      </div>
    </form>
  )
}

function DeleteAccountDialog({
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: {
  isDeleting: boolean
  errorMessage: string
  onClose: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const deletingRef = useRef(isDeleting)
  const closeRef = useRef(onClose)
  const [confirmation, setConfirmation] = useState("")
  const canDelete = confirmation.trim() === "탈퇴"

  useEffect(() => {
    deletingRef.current = isDeleting
    closeRef.current = onClose
  }, [isDeleting, onClose])

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    titleRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deletingRef.current) {
        closeRef.current()
        return
      }

      if (event.key !== "Tab") return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [])

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isDeleting) onClose()
  }

  const submitDeletion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canDelete && !isDeleting) onConfirm()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        className="bg-canvas max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-critical mb-1 text-sm font-semibold">
              복구할 수 없는 행동
            </p>
            <h2
              ref={titleRef}
              id="delete-account-title"
              tabIndex={-1}
              className="text-foreground text-xl font-bold"
            >
              회원 탈퇴할까요?
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="회원 탈퇴 창 닫기"
            disabled={isDeleting}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <p
          id="delete-account-description"
          className="text-muted mt-4 text-sm leading-6"
        >
          계정 정보와 찜한 가게 목록이 삭제되며 다시 복구할 수 없어요. 등록한
          가게가 있다면 먼저 가게 정리가 필요해요.
        </p>

        <form className="mt-5" onSubmit={submitDeletion}>
          <label
            htmlFor="delete-account-confirmation"
            className="text-foreground text-sm font-semibold"
          >
            확인을 위해 ‘탈퇴’를 입력해 주세요
          </label>
          <input
            id="delete-account-confirmation"
            type="text"
            autoComplete="off"
            className={`${profileInputClass} mt-2`}
            value={confirmation}
            disabled={isDeleting}
            onChange={(event) => setConfirmation(event.currentTarget.value)}
          />

          {errorMessage ? (
            <p className="text-critical mt-4 text-sm leading-6" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? "탈퇴하는 중" : "회원 탈퇴"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
