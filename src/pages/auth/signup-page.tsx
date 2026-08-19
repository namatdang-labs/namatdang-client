import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate, useSearchParams } from "react-router"
import { z } from "zod"
import { signup } from "../../features/auth/auth-api"
import { getAuthErrorMessage } from "../../features/auth/auth-errors"
import {
  AuthShell,
  authInputClass,
  FieldMessage,
} from "../../features/auth/auth-shell"
import { getSafeInternalPath } from "../../shared/lib/safe-internal-path"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "이름을 2자리 이상 입력해 주세요.")
      .max(50, "이름을 50자리 이하로 입력해 주세요."),
    email: z
      .email("이메일 형식을 확인해 주세요.")
      .max(255, "이메일은 255자리 이하로 입력해 주세요."),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\d{2,3}-?\d{3,4}-?\d{4}$/, "전화번호 형식을 확인해 주세요."),
    password: z
      .string()
      .min(8, "비밀번호는 8자리 이상이어야 해요.")
      .max(64, "비밀번호는 64자리 이하로 입력해 주세요.")
      .regex(/[A-Za-z]/, "영문을 1개 이상 포함해 주세요.")
      .regex(/[0-9]/, "숫자를 1개 이상 포함해 주세요."),
    passwordConfirm: z.string(),
    terms: z.literal(true, {
      error: "필수 약관에 동의해 주세요.",
    }),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 같지 않아요.",
    path: ["passwordConfirm"],
  })

type SignupValues = z.infer<typeof signupSchema>

export function SignupPage() {
  useDocumentTitle("회원가입")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRedirect = searchParams.get("redirect")
  const safeRedirect = getSafeInternalPath(requestedRedirect, "/app")
  const loginPath = requestedRedirect
    ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
    : "/login"
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      const loginSearchParams = new URLSearchParams({ joined: "1" })
      if (requestedRedirect) {
        loginSearchParams.set("redirect", safeRedirect)
      }
      navigate(`/login?${loginSearchParams.toString()}`, { replace: true })
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirm: "",
      terms: undefined,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    signupMutation.reset()

    try {
      await signupMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
      })
    } catch {
      // The mutation keeps the error so the form can explain how to recover.
    }
  })

  return (
    <AuthShell
      title="남았당을 시작해 보세요"
      description="가입하면 모두 고객 기능을 사용해요. 나중에 가게를 등록하면 관리 기능이 추가돼요."
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        {signupMutation.isError ? (
          <p
            className="border-critical/30 bg-critical/5 text-critical rounded-xl border px-4 py-3 text-sm"
            role="alert"
          >
            {getAuthErrorMessage(
              signupMutation.error,
              "회원가입을 완료하지 못했어요. 입력한 정보를 확인해 주세요.",
            )}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="signup-name"
            className="text-foreground text-sm font-semibold"
          >
            이름
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            className={`${authInputClass} mt-2`}
            placeholder="픽업할 때 확인할 이름"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            {...register("name")}
          />
          <FieldMessage id="signup-name-error">
            {errors.name?.message}
          </FieldMessage>
        </div>

        <div>
          <label
            htmlFor="signup-phone-number"
            className="text-foreground text-sm font-semibold"
          >
            전화번호
          </label>
          <input
            id="signup-phone-number"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            className={`${authInputClass} mt-2`}
            placeholder="010-1234-5678"
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={
              errors.phoneNumber ? "signup-phone-number-error" : undefined
            }
            {...register("phoneNumber")}
          />
          <FieldMessage id="signup-phone-number-error">
            {errors.phoneNumber?.message}
          </FieldMessage>
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="text-foreground text-sm font-semibold"
          >
            이메일
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className={`${authInputClass} mt-2`}
            placeholder="hello@namatdang.kr"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
          <FieldMessage id="signup-email-error">
            {errors.email?.message}
          </FieldMessage>
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="text-foreground text-sm font-semibold"
          >
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className={`${authInputClass} mt-2`}
            placeholder="영문과 숫자를 포함한 8자리 이상"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "signup-password-error" : undefined
            }
            {...register("password")}
          />
          <FieldMessage id="signup-password-error">
            {errors.password?.message}
          </FieldMessage>
        </div>

        <div>
          <label
            htmlFor="signup-password-confirm"
            className="text-foreground text-sm font-semibold"
          >
            비밀번호 확인
          </label>
          <input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            className={`${authInputClass} mt-2`}
            placeholder="비밀번호를 한 번 더 입력해 주세요"
            aria-invalid={Boolean(errors.passwordConfirm)}
            aria-describedby={
              errors.passwordConfirm
                ? "signup-password-confirm-error"
                : undefined
            }
            {...register("passwordConfirm")}
          />
          <FieldMessage id="signup-password-confirm-error">
            {errors.passwordConfirm?.message}
          </FieldMessage>
        </div>

        <div>
          <label className="text-foreground flex min-h-11 cursor-pointer items-start gap-3 rounded-xl py-2 text-sm leading-6">
            <input
              type="checkbox"
              className="accent-primary mt-1 size-5 shrink-0"
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? "signup-terms-error" : undefined}
              {...register("terms")}
            />
            <span>
              <span className="font-semibold">[필수]</span> 서비스 이용약관과
              개인정보 수집·이용에 동의해요.
            </span>
          </label>
          <FieldMessage id="signup-terms-error">
            {errors.terms?.message}
          </FieldMessage>
        </div>

        <p className="text-muted -mb-2 text-sm">
          가입이 끝나면 로그인 화면으로 이동해요.
        </p>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || signupMutation.isPending}
        >
          <UserPlus aria-hidden="true" />
          {isSubmitting || signupMutation.isPending
            ? "계정을 만드는 중"
            : "회원가입"}
        </Button>
      </form>

      <p className="text-muted mt-7 text-center text-sm">
        이미 계정이 있나요?{" "}
        <Link
          to={loginPath}
          className="text-brand-link inline-flex min-h-11 items-center rounded-lg px-1 font-semibold"
        >
          로그인
        </Link>
      </p>
    </AuthShell>
  )
}
