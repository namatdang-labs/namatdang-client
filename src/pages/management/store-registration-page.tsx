import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Store } from "lucide-react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import { ManagementPageHeader } from "../../features/management/management-ui"
import {
  storeFormSchema,
  type StoreFormValues,
} from "../../features/management/schemas"
import { StoreFormFields } from "../../features/management/store-form-fields"
import { useCreateOwnerStore } from "../../features/management/store-api"
import { ApiError } from "../../shared/api/client"
import { formatKoreanPhoneNumber } from "../../shared/lib/phone-number"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const emptyStoreValues: StoreFormValues = {
  name: "",
  phone: "",
  address: "",
  addressDetail: "",
  description: "",
}

export function StoreRegistrationPage() {
  useDocumentTitle("가게 등록")
  const navigate = useNavigate()
  const createStore = useCreateOwnerStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: emptyStoreValues,
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow="가게 관리 시작하기"
        title="가게 등록"
        description="고객이 할인 상품을 찾고 정확한 장소에서 픽업할 수 있도록 기본 정보를 등록해 주세요."
      />

      {createStore.error ? (
        <p
          className="border-critical/30 bg-critical/5 text-critical rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          {createStore.error instanceof ApiError &&
          createStore.error.status === 409
            ? "이미 등록된 정보와 충돌했어요. 입력 내용을 확인해 주세요."
            : "가게를 등록하지 못했어요. 잠시 후 다시 시도해 주세요."}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            await createStore.mutateAsync({
              name: values.name,
              address: values.address,
              addressDetail: values.addressDetail || null,
              phoneNumber: formatKoreanPhoneNumber(values.phone) || null,
              description: values.description || null,
            })
            await navigate("/manage", { replace: true })
          } catch {
            // Mutation state renders the server error above the form.
          }
        })}
        className="space-y-5"
      >
        <StoreFormFields
          register={register}
          errors={errors}
          idPrefix="registration"
        />

        <div className="border-hairline bg-canvas sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button asChild variant="secondary">
            <Link to="/manage/onboarding">
              <ArrowLeft aria-hidden="true" />
              이전으로
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createStore.isPending}
          >
            <Store aria-hidden="true" />
            {isSubmitting || createStore.isPending
              ? "등록하는 중"
              : "가게 등록하기"}
          </Button>
        </div>
      </form>
    </div>
  )
}
