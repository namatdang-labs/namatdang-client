import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { handlePhoneNumberChange } from "../../shared/lib/phone-number"
import { FormField, ManagementPanel, TextareaField } from "./management-ui"
import type { StoreFormValues } from "./schemas"

type StoreFormFieldsProps = {
  register: UseFormRegister<StoreFormValues>
  errors: FieldErrors<StoreFormValues>
  idPrefix: string
}

export function StoreFormFields({
  register,
  errors,
  idPrefix,
}: StoreFormFieldsProps) {
  const phoneField = register("phone")

  return (
    <>
      <ManagementPanel aria-labelledby={`${idPrefix}-basic-title`}>
        <h2
          id={`${idPrefix}-basic-title`}
          className="text-foreground text-lg font-bold"
        >
          기본 정보
        </h2>
        <p className="text-muted mt-1 text-sm leading-5">
          고객이 가게를 알아볼 수 있는 정보를 입력해 주세요.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <FormField
            id={`${idPrefix}-name`}
            label="가게 이름"
            placeholder="예: 성수 베이크샵"
            error={errors.name?.message}
            required
            {...register("name")}
          />
          <FormField
            id={`${idPrefix}-phone`}
            label="가게 연락처"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={13}
            placeholder="02-1234-5678"
            helper="숫자만 입력하면 하이픈이 자동으로 들어가요."
            error={errors.phone?.message}
            {...phoneField}
            onChange={(event) =>
              handlePhoneNumberChange(event, phoneField.onChange)
            }
          />
          <TextareaField
            id={`${idPrefix}-description`}
            label="가게 소개"
            placeholder="가게와 대표 상품을 간단히 소개해 주세요."
            helper="고객이 가게 상세에서 확인하는 내용이에요."
            error={errors.description?.message}
            className="sm:col-span-2"
            {...register("description")}
          />
        </div>
      </ManagementPanel>

      <ManagementPanel aria-labelledby={`${idPrefix}-location-title`}>
        <h2
          id={`${idPrefix}-location-title`}
          className="text-foreground text-lg font-bold"
        >
          위치
        </h2>
        <p className="text-muted mt-1 text-sm leading-5">
          고객이 실제로 픽업할 주소를 입력해 주세요.
        </p>
        <div className="mt-6 grid gap-5">
          <FormField
            id={`${idPrefix}-address`}
            label="도로명 주소"
            placeholder="서울 성동구 연무장길 00"
            error={errors.address?.message}
            required
            {...register("address")}
          />
          <FormField
            id={`${idPrefix}-address-detail`}
            label="상세 주소"
            placeholder="1층, 남았당 매장"
            error={errors.addressDetail?.message}
            {...register("addressDetail")}
          />
        </div>
      </ManagementPanel>
    </>
  )
}
