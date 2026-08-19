import { zodResolver } from "@hookform/resolvers/zod"
import { UserPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { z } from "zod"
import {
  AuthShell,
  authInputClass,
  FieldMessage,
} from "../../features/auth/auth-shell"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "이름을 2자리 이상 입력해 주세요.")
      .max(20, "이름을 20자리 이하로 입력해 주세요."),
    email: z.email("이메일 형식을 확인해 주세요."),
    password: z
      .string()
      .min(8, "비밀번호는 8자리 이상이어야 해요.")
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      terms: undefined,
    },
  })

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 500))
    navigate("/login?joined=1")
  })

  return (
    <AuthShell
      title="남았당을 시작해 보세요"
      description="가입하면 모두 고객 기능을 사용해요. 나중에 가게를 등록하면 관리 기능이 추가돼요."
    >
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          <UserPlus aria-hidden="true" />
          {isSubmitting ? "계정을 만드는 중" : "회원가입"}
        </Button>
      </form>

      <p className="text-muted mt-7 text-center text-sm">
        이미 계정이 있나요?{" "}
        <Link
          to="/login"
          className="text-brand-link inline-flex min-h-11 items-center rounded-lg px-1 font-semibold"
        >
          로그인
        </Link>
      </p>
    </AuthShell>
  )
}
