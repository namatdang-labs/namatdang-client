import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearchParams } from "react-router"
import { z } from "zod"
import {
  AuthShell,
  authInputClass,
  FieldMessage,
} from "../../features/auth/auth-shell"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const loginSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요."),
  password: z.string().min(8, "비밀번호 8자리 이상을 입력해 주세요."),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  useDocumentTitle("로그인")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryNotice, setRecoveryNotice] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    navigate("/")
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
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="login-password"
              className="text-foreground text-sm font-semibold"
            >
              비밀번호
            </label>
            <button
              type="button"
              className="text-brand-link min-h-11 rounded-lg px-2 text-sm font-medium"
              onClick={() => setRecoveryNotice(true)}
            >
              비밀번호 찾기
            </button>
          </div>
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
          {recoveryNotice ? (
            <p
              className="bg-brand-tint text-brand-brown mt-2 rounded-lg px-3 py-2 text-sm"
              role="status"
            >
              비밀번호 재설정 기능은 인증 API 연결 후 제공할 예정이에요.
            </p>
          ) : null}
        </div>

        <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
          <LogIn aria-hidden="true" />
          {isSubmitting ? "로그인하는 중" : "로그인"}
        </Button>
      </form>

      <p className="text-muted mt-7 text-center text-sm">
        아직 계정이 없나요?{" "}
        <Link
          to="/signup"
          className="text-brand-link inline-flex min-h-11 items-center rounded-lg px-1 font-semibold"
        >
          회원가입
        </Link>
      </p>
    </AuthShell>
  )
}
