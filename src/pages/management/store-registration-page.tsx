import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Store } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link } from "react-router"
import {
  FormSuccessMessage,
  ManagementPageHeader,
} from "../../features/management/management-ui"
import {
  storeFormSchema,
  type StoreFormValues,
} from "../../features/management/schemas"
import { StoreFormFields } from "../../features/management/store-form-fields"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const emptyStoreValues: StoreFormValues = {
  name: "",
  category: "",
  phone: "",
  address: "",
  addressDetail: "",
  pickupStart: "18:00",
  pickupEnd: "20:00",
  pickupGuide: "",
  description: "",
}

export function StoreRegistrationPage() {
  useDocumentTitle("가게 등록")
  const [saved, setSaved] = useState(false)
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

      {saved ? (
        <FormSuccessMessage>
          가게 정보를 확인했어요. 등록을 마치면 관리 홈에서 할인을 시작할 수
          있어요.
        </FormSuccessMessage>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(() => setSaved(true))}
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
          <Button type="submit" disabled={isSubmitting}>
            <Store aria-hidden="true" />
            {isSubmitting ? "등록하는 중" : "가게 등록하기"}
          </Button>
        </div>
      </form>
    </div>
  )
}
