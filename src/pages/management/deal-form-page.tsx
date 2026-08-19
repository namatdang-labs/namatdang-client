import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Eye, Plus, Save, Tag, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { Link, useParams } from "react-router"
import { formatPrice } from "../../features/management/data"
import {
  FormField,
  FormSuccessMessage,
  ManagementPageHeader,
  ManagementPanel,
  TextareaField,
} from "../../features/management/management-ui"
import {
  dealFormSchema,
  type DealFormValues,
} from "../../features/management/schemas"
import { useManagementStore } from "../../features/management/store-context"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const newDealValues: DealFormValues = {
  name: "",
  description: "",
  items: [{ name: "", originalPrice: 0, salePrice: 0, stock: 1 }],
  pickupStart: "18:00",
  pickupEnd: "20:00",
}

const existingDealValues: Record<string, DealFormValues> = {
  "deal-001": {
    name: "버터 크루아상 세트",
    description: "버터 크루아상과 소금빵을 함께 담은 오늘의 세트예요.",
    items: [
      {
        name: "버터 크루아상",
        originalPrice: 6000,
        salePrice: 3900,
        stock: 3,
      },
      { name: "소금빵", originalPrice: 3000, salePrice: 1500, stock: 5 },
    ],
    pickupStart: "19:00",
    pickupEnd: "20:00",
  },
  "deal-002": {
    name: "오늘의 빵 꾸러미",
    description: "휘낭시에와 스콘을 골고루 담은 마감 꾸러미예요.",
    items: [
      {
        name: "구움과자 꾸러미",
        originalPrice: 15000,
        salePrice: 7900,
        stock: 1,
      },
    ],
    pickupStart: "18:30",
    pickupEnd: "19:30",
  },
  "deal-003": {
    name: "마들렌 4종 상자",
    description: "오늘 구운 마들렌 네 가지 맛을 한 상자에 담았어요.",
    items: [
      {
        name: "마들렌 4종 상자",
        originalPrice: 10000,
        salePrice: 5900,
        stock: 1,
      },
    ],
    pickupStart: "18:00",
    pickupEnd: "19:00",
  },
  "deal-004": {
    name: "어제 등록한 스콘 세트",
    description: "마감된 할인 화면을 확인하기 위한 스콘 세트예요.",
    items: [
      {
        name: "플레인 스콘 세트",
        originalPrice: 11000,
        salePrice: 6500,
        stock: 2,
      },
    ],
    pickupStart: "19:00",
    pickupEnd: "20:00",
  },
  "deal-101": {
    name: "과일 조각 케이크",
    description: "오늘 만든 제철 과일 조각 케이크를 골라 보세요.",
    items: [
      {
        name: "제철 과일 조각 케이크",
        originalPrice: 7800,
        salePrice: 4900,
        stock: 4,
      },
    ],
    pickupStart: "18:00",
    pickupEnd: "19:30",
  },
  "deal-102": {
    name: "크림 디저트 상자",
    description: "마감된 할인 화면을 확인하기 위한 디저트 상자예요.",
    items: [
      {
        name: "크림 디저트 상자",
        originalPrice: 13000,
        salePrice: 7500,
        stock: 1,
      },
    ],
    pickupStart: "18:30",
    pickupEnd: "19:30",
  },
}

export function DealFormPage() {
  const { dealId } = useParams()
  const { store } = useManagementStore()
  const isEditing = Boolean(dealId)
  const initialValues = dealId ? existingDealValues[dealId] : newDealValues
  const formKey = dealId ?? "new"
  const pageTitle = isEditing ? "할인 수정" : "할인 등록"
  useDocumentTitle(pageTitle)
  const [savedFormKey, setSavedFormKey] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: initialValues ?? newDealValues,
  })
  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  useEffect(() => {
    reset(initialValues ?? newDealValues)
  }, [initialValues, reset])

  const watchedValues = useWatch({ control })
  const name = watchedValues.name ?? ""
  const items = watchedValues.items ?? []
  const previewItem = items.find((item) => (item?.salePrice ?? 0) > 0)
  const originalPrice = previewItem?.originalPrice ?? 0
  const salePrice = previewItem?.salePrice ?? 0
  const stock = items.reduce(
    (total, item) =>
      total + (Number.isFinite(item?.stock) ? (item?.stock ?? 0) : 0),
    0,
  )
  const pickupStart = watchedValues.pickupStart ?? ""
  const pickupEnd = watchedValues.pickupEnd ?? ""
  const discountRate =
    originalPrice > 0 && salePrice > 0 && salePrice < originalPrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : 0

  if (isEditing && !initialValues) {
    return (
      <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
        <ManagementPageHeader
          eyebrow={`${store.name} · 할인 관리`}
          title="할인을 찾을 수 없어요"
          description="할인 목록에서 수정할 항목을 다시 선택해 주세요."
        />
        <Button asChild variant="secondary">
          <Link to="/manage/deals">
            <ArrowLeft aria-hidden="true" />
            할인 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={`${store.name} · 할인 관리`}
        title={pageTitle}
        description="Deal API 연결 전 가격·수량·픽업 입력과 미리보기 상태를 확인하세요."
      />

      {savedFormKey === formKey ? (
        <FormSuccessMessage>
          입력 상태를 화면에서 확인했어요. 서버에는 저장되지 않아요.
        </FormSuccessMessage>
      ) : null}

      <form
        noValidate
        onChange={() => setSavedFormKey(null)}
        onSubmit={handleSubmit(() => setSavedFormKey(formKey))}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-5">
          <ManagementPanel aria-labelledby="deal-product-title">
            <h2
              id="deal-product-title"
              className="text-foreground text-lg font-bold"
            >
              할인 상품
            </h2>
            <p className="text-muted mt-1 text-sm leading-5">
              고객이 상품을 바로 이해할 수 있게 구체적으로 적어 주세요.
            </p>
            <div className="mt-6 grid gap-5">
              <FormField
                id="deal-name"
                label="할인 이름"
                placeholder="예: 버터 크루아상 세트"
                error={errors.name?.message}
                required
                {...register("name")}
              />
              <TextareaField
                id="deal-description"
                label="상품 설명"
                placeholder="구성 상품과 보관 방법을 알려 주세요."
                helper="품목 구성과 알레르기 관련 안내가 있다면 함께 적어 주세요."
                error={errors.description?.message}
                {...register("description")}
              />
            </div>
          </ManagementPanel>

          <ManagementPanel aria-labelledby="deal-price-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="deal-price-title"
                  className="text-foreground text-lg font-bold"
                >
                  판매 품목
                </h2>
                <p className="text-muted mt-1 text-sm leading-5">
                  고객이 각각 수량을 고를 수 있도록 품목별 가격과 재고를 입력해
                  주세요.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() =>
                  append({
                    name: "",
                    originalPrice: 0,
                    salePrice: 0,
                    stock: 1,
                  })
                }
              >
                <Plus aria-hidden="true" />
                품목 추가
              </Button>
            </div>

            <div className="mt-6 grid gap-4">
              {fields.map((field, index) => {
                const item = items[index]
                const itemOriginalPrice = item?.originalPrice ?? 0
                const itemSalePrice = item?.salePrice ?? 0
                const itemDiscountRate =
                  itemOriginalPrice > 0 &&
                  itemSalePrice > 0 &&
                  itemSalePrice < itemOriginalPrice
                    ? Math.round((1 - itemSalePrice / itemOriginalPrice) * 100)
                    : 0

                return (
                  <fieldset
                    key={field.id}
                    className="border-hairline rounded-xl border p-4 sm:p-5"
                  >
                    <legend className="text-foreground px-1 font-bold">
                      품목 {index + 1}
                    </legend>
                    {fields.length > 1 ? (
                      <div className="mb-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="compact"
                          className="text-critical"
                          onClick={() => remove(index)}
                        >
                          <Trash2 aria-hidden="true" />
                          삭제
                        </Button>
                      </div>
                    ) : (
                      <div className="h-3" aria-hidden="true" />
                    )}
                    <div className="grid gap-5 sm:grid-cols-3">
                      <FormField
                        id={`deal-item-${index}-name`}
                        label="품목 이름"
                        placeholder="예: 버터 크루아상"
                        error={errors.items?.[index]?.name?.message}
                        className="sm:col-span-3"
                        required
                        {...register(`items.${index}.name`)}
                      />
                      <FormField
                        id={`deal-item-${index}-original-price`}
                        label="정가"
                        type="number"
                        inputMode="numeric"
                        min="100"
                        step="100"
                        placeholder="6000"
                        error={errors.items?.[index]?.originalPrice?.message}
                        required
                        {...register(`items.${index}.originalPrice`, {
                          valueAsNumber: true,
                        })}
                      />
                      <FormField
                        id={`deal-item-${index}-sale-price`}
                        label="할인가"
                        type="number"
                        inputMode="numeric"
                        min="100"
                        step="100"
                        placeholder="3900"
                        error={errors.items?.[index]?.salePrice?.message}
                        helper={
                          itemDiscountRate > 0
                            ? `${itemDiscountRate}% 할인`
                            : undefined
                        }
                        required
                        {...register(`items.${index}.salePrice`, {
                          valueAsNumber: true,
                        })}
                      />
                      <FormField
                        id={`deal-item-${index}-stock`}
                        label="판매 수량"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="999"
                        error={errors.items?.[index]?.stock?.message}
                        helper="예약 가능한 수량"
                        required
                        {...register(`items.${index}.stock`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </fieldset>
                )
              })}
            </div>
          </ManagementPanel>

          <ManagementPanel aria-labelledby="deal-pickup-title">
            <h2
              id="deal-pickup-title"
              className="text-foreground text-lg font-bold"
            >
              픽업 시간
            </h2>
            <p className="text-muted mt-1 text-sm leading-5">
              오늘 고객이 방문할 수 있는 시간을 선택해 주세요.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField
                id="deal-pickup-start"
                label="픽업 시작"
                type="time"
                error={errors.pickupStart?.message}
                required
                {...register("pickupStart")}
              />
              <FormField
                id="deal-pickup-end"
                label="픽업 종료"
                type="time"
                error={errors.pickupEnd?.message}
                required
                {...register("pickupEnd")}
              />
            </div>
          </ManagementPanel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8">
          <ManagementPanel aria-labelledby="deal-preview-title">
            <div className="flex items-center gap-2">
              <Eye className="text-muted size-5" aria-hidden="true" />
              <h2
                id="deal-preview-title"
                className="text-foreground text-base font-bold"
              >
                공개 전 확인
              </h2>
            </div>
            <div className="border-hairline mt-5 rounded-lg border p-4">
              <span className="bg-brand-tint text-brand-link inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold">
                {discountRate > 0 ? `${discountRate}% 할인` : "할인율"}
              </span>
              <h3 className="text-foreground mt-3 text-base font-bold">
                {name || "할인 이름"}
              </h3>
              <p className="mt-3 flex items-baseline gap-2">
                <strong className="text-foreground text-xl tabular-nums">
                  {salePrice > 0 ? formatPrice(salePrice) : "할인가"}
                </strong>
                {originalPrice > 0 ? (
                  <span className="text-muted text-sm tabular-nums line-through">
                    {formatPrice(originalPrice)}
                  </span>
                ) : null}
              </p>
              <dl className="border-hairline text-muted mt-4 grid gap-2 border-t pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>판매 수량</dt>
                  <dd className="text-foreground font-semibold tabular-nums">
                    {stock || 0}개
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>픽업</dt>
                  <dd className="text-foreground font-semibold tabular-nums">
                    {pickupStart}–{pickupEnd}
                  </dd>
                </div>
              </dl>
            </div>
          </ManagementPanel>

          <div className="border-hairline bg-canvas sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t px-4 py-4 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <Button asChild variant="secondary" className="w-full">
              <Link to="/manage/deals">
                <ArrowLeft aria-hidden="true" />
                목록으로
              </Link>
            </Button>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isEditing ? (
                <Save aria-hidden="true" />
              ) : (
                <Tag aria-hidden="true" />
              )}
              {isSubmitting
                ? "확인하는 중"
                : isEditing
                  ? "변경 상태 미리보기"
                  : "입력 상태 미리보기"}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}
