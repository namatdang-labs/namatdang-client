import type { FieldErrors, UseFormRegister } from "react-hook-form"
import {
  FormField,
  ManagementPanel,
  SelectField,
  TextareaField,
} from "./management-ui"
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
          <SelectField
            id={`${idPrefix}-category`}
            label="가게 종류"
            error={errors.category?.message}
            required
            {...register("category")}
          >
            <option value="">선택해 주세요</option>
            <option value="bakery">베이커리</option>
            <option value="dessert">디저트</option>
            <option value="cafe">카페</option>
            <option value="other">기타</option>
          </SelectField>
          <FormField
            id={`${idPrefix}-phone`}
            label="가게 연락처"
            type="tel"
            inputMode="tel"
            placeholder="02-1234-5678"
            error={errors.phone?.message}
            required
            {...register("phone")}
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

      <ManagementPanel aria-labelledby={`${idPrefix}-pickup-title`}>
        <h2
          id={`${idPrefix}-pickup-title`}
          className="text-foreground text-lg font-bold"
        >
          기본 픽업 정보
        </h2>
        <p className="text-muted mt-1 text-sm leading-5">
          할인마다 바꿀 수 있는 기본 픽업 시간과 안내예요.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <FormField
            id={`${idPrefix}-pickup-start`}
            label="픽업 시작"
            type="time"
            error={errors.pickupStart?.message}
            required
            {...register("pickupStart")}
          />
          <FormField
            id={`${idPrefix}-pickup-end`}
            label="픽업 종료"
            type="time"
            error={errors.pickupEnd?.message}
            required
            {...register("pickupEnd")}
          />
          <TextareaField
            id={`${idPrefix}-pickup-guide`}
            label="픽업 안내"
            placeholder="매장 카운터에서 예약번호를 보여 주세요."
            helper="찾아오는 방법이나 수령 위치를 구체적으로 적어 주세요."
            error={errors.pickupGuide?.message}
            className="sm:col-span-2"
            {...register("pickupGuide")}
          />
        </div>
      </ManagementPanel>
    </>
  )
}
