import { zodResolver } from "@hookform/resolvers/zod"
import { Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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
import { useUpdateOwnerStore } from "../../features/management/store-api"
import { useManagementStore } from "../../features/management/store-context"
import { ApiError } from "../../shared/api/client"
import { formatKoreanPhoneNumber } from "../../shared/lib/phone-number"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

export function StoreSettingsPage() {
  useDocumentTitle("가게 정보")
  const { store } = useManagementStore()
  const valuesForStore = useMemo<StoreFormValues>(
    () => ({
      name: store.name,
      phone: formatKoreanPhoneNumber(store.phoneNumber ?? ""),
      address: store.address,
      addressDetail: store.addressDetail ?? "",
      description: store.description ?? "",
      latitude: store.latitude,
      longitude: store.longitude,
    }),
    [store],
  )
  const updateStore = useUpdateOwnerStore()
  const [savedStoreId, setSavedStoreId] = useState<string | null>(null)
  const {
    register,
    control,
    getValues,
    setValue,
    setError,
    trigger,
    clearErrors,
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

      {savedStoreId === store.id && !isDirty ? (
        <FormSuccessMessage>가게 정보를 저장했어요.</FormSuccessMessage>
      ) : null}

      {updateStore.error ? (
        <p
          className="border-critical/30 bg-critical/5 text-critical rounded-xl border px-4 py-3 text-sm"
          role="alert"
        >
          {updateStore.error instanceof ApiError &&
          updateStore.error.status === 404
            ? "관리할 수 있는 가게를 찾지 못했어요."
            : "가게 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요."}
        </p>
      ) : null}

      <form
        noValidate
        onChange={() => setSavedStoreId(null)}
        onSubmit={handleSubmit(async (values) => {
          const hasConfirmedLocation =
            values.latitude !== null && values.longitude !== null
          const storeHadConfirmedLocation =
            store.latitude !== null && store.longitude !== null
          const addressChanged = values.address.trim() !== store.address.trim()

          if (
            !hasConfirmedLocation &&
            (addressChanged || storeHadConfirmedLocation)
          ) {
            setError("latitude", {
              type: "manual",
              message: addressChanged
                ? "변경한 주소의 위치를 찾은 뒤 저장해 주세요."
                : "기존 픽업 위치를 다시 확인한 뒤 저장해 주세요.",
            })
            return
          }

          try {
            await updateStore.mutateAsync({
              storeId: Number(store.id),
              request: {
                name: values.name,
                address: values.address,
                addressDetail: values.addressDetail,
                phoneNumber: formatKoreanPhoneNumber(values.phone),
                description: values.description,
                latitude: values.latitude,
                longitude: values.longitude,
              },
            })
            reset(values)
            setSavedStoreId(store.id)
          } catch {
            // Mutation state renders the server error above the form.
          }
        })}
        className="space-y-5"
      >
        <StoreFormFields
          register={register}
          control={control}
          getValues={getValues}
          setValue={setValue}
          trigger={trigger}
          clearErrors={clearErrors}
          errors={errors}
          idPrefix="settings"
        />

        <div className="border-hairline bg-canvas sticky bottom-0 -mx-4 flex justify-end border-t px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <Button
            type="submit"
            disabled={isSubmitting || updateStore.isPending || !isDirty}
          >
            <Save aria-hidden="true" />
            {isSubmitting || updateStore.isPending
              ? "저장하는 중"
              : "변경 내용 저장"}
          </Button>
        </div>
      </form>
    </div>
  )
}
