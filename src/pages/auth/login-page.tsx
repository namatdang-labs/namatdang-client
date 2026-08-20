import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearchParams } from "react-router"
import { z } from "zod"
import { login } from "../../features/auth/auth-api"
import { getAuthErrorMessage } from "../../features/auth/auth-errors"
import {
  AuthShell,
  authInputClass,
  FieldMessage,
} from "../../features/auth/auth-shell"
import { saveAccessToken } from "../../features/auth/auth-session"
import { getSafeInternalPath } from "../../shared/lib/safe-internal-path"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const loginSchema = z.object({
  email: z
    .email("이메일 형식을 확인해 주세요.")
    .max(255, "이메일은 255자리 이하로 입력해 주세요."),
  password: z
    .string()
    .min(8, "비밀번호 8자리 이상을 입력해 주세요.")
    .max(64, "비밀번호는 64자리 이하로 입력해 주세요."),
})

type LoginValues = z.infer<typeof loginSchema>

function getSafeRedirect(searchParams: URLSearchParams) {
  return getSafeInternalPath(searchParams.get("redirect"), "/app")
}

function getSignupPath(searchParams: URLSearchParams) {
  if (!searchParams.has("redirect")) return "/signup"

  return `/signup?redirect=${encodeURIComponent(getSafeRedirect(searchParams))}`
}

export function LoginPage() {
  useDocumentTitle("로그인")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => {
      queryClient.clear()
      saveAccessToken(response.accessToken)
      navigate(getSafeRedirect(searchParams), { replace: true })
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async (values) => {
    loginMutation.reset()

    try {
      await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })
    } catch {
      // The mutation keeps the error so the form can explain how to recover.
    }
  })

  return (
    <AuthShell
      title="다시 만나서 반가워요"
      description="동네의 오늘 할인과 예약 내역을 이어서 확인해 보세요."
    >
      {searchParams.get("joined") === "1" ? (
        <p
          className="bg-brand-tint text-brand-brown mb-5 rounded-xl px-4 py-3 text-sm font-medium"
          role="status"
        >
          회원가입이 완료됐어요. 로그인해 주세요.
        </p>
      ) : null}

      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {loginMutation.isError ? (
          <p
            className="border-critical/30 bg-critical/5 text-critical rounded-xl border px-4 py-3 text-sm"
            role="alert"
          >
            {getAuthErrorMessage(
              loginMutation.error,
              "로그인하지 못했어요. 입력한 정보를 확인해 주세요.",
            )}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="login-email"
            className="text-foreground text-sm font-semibold"
          >
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={`${authInputClass} mt-2`}
            placeholder="hello@namatdang.kr"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            {...register("email")}
          />
          <FieldMessage id="login-email-error">
            {errors.email?.message}
          </FieldMessage>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="text-foreground text-sm font-semibold"
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={`${authInputClass} pr-12`}
              placeholder="8자리 이상"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              {...register("password")}
            />
            <button
              type="button"
              className="text-muted absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-lg"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={20} />
              ) : (
                <Eye aria-hidden="true" size={20} />
              )}
            </button>
          </div>
          <FieldMessage id="login-password-error">
            {errors.password?.message}
          </FieldMessage>
        </div>

        <Button
          type="submit"
          className="mt-1 w-full"
          disabled={isSubmitting || loginMutation.isPending}
        >
          <LogIn aria-hidden="true" />
          {isSubmitting || loginMutation.isPending ? "로그인하는 중" : "로그인"}
        </Button>
      </form>

      <p className="text-muted mt-7 text-center text-sm">
        아직 계정이 없나요?{" "}
        <Link
          to={getSignupPath(searchParams)}
          className="text-brand-link inline-flex min-h-11 items-center rounded-lg px-1 font-semibold"
        >
          회원가입
        </Link>
      </p>
    </AuthShell>
  )
}
