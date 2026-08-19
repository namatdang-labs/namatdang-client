import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  FormSuccessMessage,
  ManagementPageHeader,
} from "../../features/management/management-ui"
import {
  storeFormSchema,
  type StoreFormValues,
} from "../../features/management/schemas"
import { StoreFormFields } from "../../features/management/store-form-fields"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const currentStoreValues: Record<string, StoreFormValues> = {
  seongsu: {
    name: "성수 베이크샵",
    category: "bakery",
    phone: "02-1234-5678",
    address: "서울 성동구 연무장길 00",
    addressDetail: "1층",
    pickupStart: "18:00",
    pickupEnd: "20:00",
    pickupGuide: "매장 카운터에서 예약번호를 보여 주세요.",
    description: "매일 아침 직접 굽는 빵과 계절 디저트를 만들어요.",
  },
  geondae: {
    name: "건대 디저트룸",
    category: "dessert",
    phone: "02-9876-5432",
    address: "서울 광진구 능동로 120",
    addressDetail: "2층",
    pickupStart: "17:30",
    pickupEnd: "19:30",
    pickupGuide: "계산대에서 예약자 이름을 말씀해 주세요.",
    description: "계절 과일과 크림으로 작은 디저트를 만들어요.",
  },
}

export function StoreSettingsPage() {
  useDocumentTitle("가게 정보")
  const { store } = useManagementStore()
  const valuesForStore = currentStoreValues[store.id]
  const [savedStoreId, setSavedStoreId] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: valuesForStore,
  })

  useEffect(() => {
    reset(valuesForStore)
  }, [reset, valuesForStore])

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={store.name}
        title="가게 정보"
        description="고객에게 보이는 가게 위치와 기본 픽업 안내를 관리하세요."
      />

      {savedStoreId === store.id ? (
        <FormSuccessMessage>가게 정보를 저장했어요.</FormSuccessMessage>
      ) : null}

      <form
        noValidate
        onChange={() => setSavedStoreId(null)}
        onSubmit={handleSubmit((values) => {
          reset(values)
          setSavedStoreId(store.id)
        })}
        className="space-y-5"
      >
        <StoreFormFields
          register={register}
          errors={errors}
          idPrefix="settings"
        />

        <div className="border-hairline bg-canvas sticky bottom-0 -mx-4 flex justify-end border-t px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            <Save aria-hidden="true" />
            {isSubmitting ? "저장하는 중" : "변경 내용 저장"}
          </Button>
        </div>
      </form>
    </div>
  )
}
