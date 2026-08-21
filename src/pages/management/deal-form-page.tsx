import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  Clock3,
  Eye,
  Package,
  Plus,
  Tag,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { Link, useNavigate, useParams } from "react-router"

import {
  formatManagementDateTime,
  formatPrice,
} from "../../features/management/data"
import {
  getManagementErrorMessage,
  useCreateOwnerDeal,
  useOwnerDeal,
} from "../../features/management/management-api"
import {
  DealStatusBadge,
  FormField,
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

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function createDealDefaults(now: number): DealFormValues {
  const defaultEnd = new Date(now + 2 * 60 * 60 * 1000)
  defaultEnd.setMinutes(Math.ceil(defaultEnd.getMinutes() / 10) * 10, 0, 0)

  return {
    description: "",
    items: [
      {
        name: "",
        originalPrice: 0,
        salePrice: 0,
        totalQuantity: 1,
      },
    ],
    salesEndsAt: toDateTimeLocalValue(defaultEnd),
  }
}

export function DealFormPage() {
  useDocumentTitle("할인 등록")
  const { store } = useManagementStore()
  const navigate = useNavigate()
  const createDeal = useCreateOwnerDeal()
  const [dateDefaults] = useState(() => {
    const now = Date.now()
    return {
      defaultValues: createDealDefaults(now),
      earliestEnd: toDateTimeLocalValue(new Date(now + 11 * 60 * 1000)),
      latestEnd: toDateTimeLocalValue(new Date(now + 24 * 60 * 60 * 1000)),
    }
  })
  const { defaultValues, earliestEnd, latestEnd } = dateDefaults
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues,
  })
  const { fields, append, remove } = useFieldArray({ control, name: "items" })
  const watchedValues = useWatch({ control })
  const items = watchedValues.items ?? []
  const previewItem = items.find((item) => (item?.salePrice ?? 0) > 0)
  const originalPrice = previewItem?.originalPrice ?? 0
  const salePrice = previewItem?.salePrice ?? 0
  const totalQuantity = items.reduce(
    (total, item) =>
      total +
      (Number.isFinite(item?.totalQuantity) ? (item?.totalQuantity ?? 0) : 0),
    0,
  )
  const discountRate =
    originalPrice > 0 && salePrice > 0 && salePrice < originalPrice
      ? Math.round((1 - salePrice / originalPrice) * 100)
      : 0

  const submitting = isSubmitting || createDeal.isPending

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={`${store.name} · 할인 관리`}
        title="할인 등록"
        description="남은 품목의 가격과 수량, 예약 마감 시각을 입력해 할인을 공개하세요."
      />

      {createDeal.error ? (
        <p
          role="alert"
          className="border-critical/30 bg-critical/5 text-critical rounded-xl border px-4 py-3 text-sm"
        >
          {getManagementErrorMessage(
            createDeal.error,
            "할인을 등록하지 못했어요. 입력 내용과 마감 시각을 확인한 뒤 다시 시도해 주세요.",
          )}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            const deal = await createDeal.mutateAsync({
              storeId: Number(store.id),
              request: {
                salesEndsAt:
                  values.salesEndsAt.length === 16
                    ? `${values.salesEndsAt}:00`
                    : values.salesEndsAt,
                description: values.description || null,
                items: values.items,
              },
            })
            await navigate(`/manage/deals/${deal.dealId}`, { replace: true })
          } catch {
            // Mutation state renders the server response above the form.
          }
        })}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="space-y-5">
          <ManagementPanel aria-labelledby="deal-guide-title">
            <h2
              id="deal-guide-title"
              className="text-foreground text-lg font-bold"
            >
              할인 안내
            </h2>
            <p className="text-muted mt-1 text-sm leading-5">
              구성과 보관 방법처럼 고객이 예약 전에 알아야 할 내용을 적어
              주세요.
            </p>
            <TextareaField
              id="deal-description"
              label="안내 사항"
              placeholder="예: 오늘 구운 빵을 종류별로 준비했어요. 당일 섭취를 권장해요."
              helper="선택 입력이며 500자까지 작성할 수 있어요."
              error={errors.description?.message}
              className="mt-6"
              maxLength={500}
              {...register("description")}
            />
          </ManagementPanel>

          <ManagementPanel aria-labelledby="deal-items-title">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2
                  id="deal-items-title"
                  className="text-foreground text-lg font-bold"
                >
                  판매 품목
                </h2>
                <p className="text-muted mt-1 text-sm leading-5">
                  고객이 품목별로 수량을 고를 수 있도록 가격과 재고를 입력해
                  주세요.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="compact"
                disabled={fields.length >= 10}
                onClick={() =>
                  append({
                    name: "",
                    originalPrice: 0,
                    salePrice: 0,
                    totalQuantity: 1,
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
                        maxLength={50}
                        required
                        {...register(`items.${index}.name`)}
                      />
                      <FormField
                        id={`deal-item-${index}-original-price`}
                        label="정가"
                        type="number"
                        inputMode="numeric"
                        min="100"
                        max="1000000"
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
                        max="1000000"
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
                        id={`deal-item-${index}-quantity`}
                        label="판매 수량"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="99"
                        error={errors.items?.[index]?.totalQuantity?.message}
                        helper="예약 가능한 수량"
                        required
                        {...register(`items.${index}.totalQuantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </fieldset>
                )
              })}
            </div>
          </ManagementPanel>

          <ManagementPanel aria-labelledby="deal-end-title">
            <h2
              id="deal-end-title"
              className="text-foreground text-lg font-bold"
            >
              예약 마감
            </h2>
            <p className="text-muted mt-1 text-sm leading-5">
              지금부터 10분 이후, 24시간 안의 시각을 선택해 주세요.
            </p>
            <FormField
              id="deal-sales-ends-at"
              label="예약 마감 시각"
              type="datetime-local"
              min={earliestEnd}
              max={latestEnd}
              error={errors.salesEndsAt?.message}
              className="mt-6 max-w-sm"
              required
              {...register("salesEndsAt")}
            />
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
                {previewItem?.name || "품목 이름"}
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
                  <dt>전체 판매 수량</dt>
                  <dd className="text-foreground font-semibold tabular-nums">
                    {totalQuantity}개
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>등록 품목</dt>
                  <dd className="text-foreground font-semibold tabular-nums">
                    {fields.length}개
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
            <Button type="submit" className="w-full" disabled={submitting}>
              <Tag aria-hidden="true" />
              {submitting ? "공개하는 중" : "할인 공개"}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}

export function ManagementDealDetailPage() {
  useDocumentTitle("할인 상세")
  const { store } = useManagementStore()
  const { dealId: dealIdParam } = useParams()
  const dealId = /^\d+$/.test(dealIdParam ?? "") ? Number(dealIdParam) : null
  const dealQuery = useOwnerDeal(dealId)

  return (
    <div className="space-y-6 py-6 lg:space-y-8 lg:py-8">
      <ManagementPageHeader
        eyebrow={`${store.name} · 할인 관리`}
        title="할인 상세"
        description="공개된 품목과 현재 판매 상태를 확인하세요."
      />

      {dealId === null ? (
        <ManagementPanel className="py-10 text-center">
          <h2 className="text-foreground text-lg font-bold">
            할인 주소가 올바르지 않아요
          </h2>
          <p className="text-muted mt-2 text-sm">
            할인 목록에서 확인할 항목을 다시 선택해 주세요.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/manage/deals">할인 목록으로</Link>
          </Button>
        </ManagementPanel>
      ) : dealQuery.isPending ? (
        <ManagementPanel className="min-h-64" aria-busy="true">
          <p className="text-muted flex min-h-52 items-center justify-center text-sm">
            할인 정보를 불러오는 중이에요.
          </p>
        </ManagementPanel>
      ) : dealQuery.isError ? (
        <ManagementPanel className="py-10 text-center">
          <h2 className="text-foreground text-lg font-bold">
            할인 정보를 불러오지 못했어요
          </h2>
          <p className="text-muted mt-2 text-sm">
            잠시 후 다시 시도하거나 할인 목록으로 돌아가 주세요.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void dealQuery.refetch()}
            >
              다시 시도
            </Button>
            <Button asChild variant="secondary">
              <Link to="/manage/deals">할인 목록으로</Link>
            </Button>
          </div>
        </ManagementPanel>
      ) : dealQuery.data.storeId !== Number(store.id) ? (
        <ManagementPanel className="py-10 text-center">
          <h2 className="text-foreground text-lg font-bold">
            다른 가게에서 공개한 할인이에요
          </h2>
          <p className="text-muted mt-2 text-sm">
            가게를 전환한 뒤 해당 할인 정보를 확인해 주세요.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/manage/deals">할인 목록으로</Link>
          </Button>
        </ManagementPanel>
      ) : (
        <>
          <ManagementPanel>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-muted text-sm">
                  할인 #{dealQuery.data.dealId}
                </p>
                <h2 className="text-foreground mt-1 text-xl font-bold">
                  {dealQuery.data.description || "등록된 할인"}
                </h2>
              </div>
              <DealStatusBadge status={dealQuery.data.status} />
            </div>
            <dl className="border-hairline mt-5 grid gap-4 border-t pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-muted text-xs">예약 마감</dt>
                <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                  {formatManagementDateTime(dealQuery.data.salesEndsAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">공개 시각</dt>
                <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                  {formatManagementDateTime(dealQuery.data.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs">등록 품목</dt>
                <dd className="text-foreground mt-1 text-sm font-semibold tabular-nums">
                  {dealQuery.data.items.length}개
                </dd>
              </div>
            </dl>
          </ManagementPanel>

          <ManagementPanel aria-labelledby="deal-detail-items-title">
            <h2
              id="deal-detail-items-title"
              className="text-foreground text-lg font-bold"
            >
              판매 품목
            </h2>
            <div className="divide-hairline mt-4 divide-y">
              {dealQuery.data.items.map((item) => (
                <article
                  key={item.dealItemId}
                  className="grid gap-4 py-5 first:pt-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground font-bold">{item.name}</h3>
                      <span className="bg-surface text-muted inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold">
                        {item.status === "SELLING" ? "판매 중" : "품절"}
                      </span>
                    </div>
                    <p className="mt-2 flex items-baseline gap-2">
                      <strong className="text-foreground text-lg tabular-nums">
                        {formatPrice(item.salePrice)}
                      </strong>
                      <span className="text-muted text-sm tabular-nums line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                      <span className="text-brand-link text-sm font-semibold tabular-nums">
                        {item.discountRate}%
                      </span>
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-5 text-sm">
                    <div>
                      <dt className="text-muted flex items-center gap-1.5">
                        <Package className="size-4" aria-hidden="true" />
                        남은 수량
                      </dt>
                      <dd className="text-foreground mt-1 font-bold tabular-nums">
                        {item.remainingQuantity}개
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted flex items-center gap-1.5">
                        <Clock3 className="size-4" aria-hidden="true" />
                        등록 수량
                      </dt>
                      <dd className="text-foreground mt-1 font-bold tabular-nums">
                        {item.totalQuantity}개
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </ManagementPanel>

          <Button asChild variant="secondary">
            <Link to="/manage/deals">
              <ArrowLeft aria-hidden="true" />
              할인 목록으로
            </Link>
          </Button>
        </>
      )}
    </div>
  )
}
