import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react"
import { useMemo, useRef, useState } from "react"
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
} from "react-hook-form"
import { useWatch } from "react-hook-form"
import {
  geocodeAddress,
  isGeocodingError,
  isNaverMapLoadError,
  StoreLocationMap,
  type MapCoordinate,
} from "../map"
import { handlePhoneNumberChange } from "../../shared/lib/phone-number"
import { Button } from "../../shared/ui/button"
import { FormField, ManagementPanel, TextareaField } from "./management-ui"
import type { StoreFormValues } from "./schemas"

type StoreFormFieldsProps = {
  register: UseFormRegister<StoreFormValues>
  control: Control<StoreFormValues>
  getValues: UseFormGetValues<StoreFormValues>
  setValue: UseFormSetValue<StoreFormValues>
  trigger: UseFormTrigger<StoreFormValues>
  clearErrors: UseFormClearErrors<StoreFormValues>
  errors: FieldErrors<StoreFormValues>
  idPrefix: string
}

function isLatitude(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  )
}

function isLongitude(value: number | null | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  )
}

function normalizeCoordinate(value: number) {
  return Number(value.toFixed(7))
}

const PIN_NUDGE_DISTANCE_METERS = 2
const METERS_PER_LATITUDE_DEGREE = 111_320

type PinNudgeDirection = "north" | "south" | "east" | "west"

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function nudgeCoordinate(
  position: MapCoordinate,
  direction: PinNudgeDirection,
): MapCoordinate {
  const latitudeDelta = PIN_NUDGE_DISTANCE_METERS / METERS_PER_LATITUDE_DEGREE
  const longitudeScale = Math.max(
    Math.abs(Math.cos((position.latitude * Math.PI) / 180)),
    0.01,
  )
  const longitudeDelta = latitudeDelta / longitudeScale

  switch (direction) {
    case "north":
      return {
        ...position,
        latitude: clamp(position.latitude + latitudeDelta, -90, 90),
      }
    case "south":
      return {
        ...position,
        latitude: clamp(position.latitude - latitudeDelta, -90, 90),
      }
    case "east":
      return {
        ...position,
        longitude: clamp(position.longitude + longitudeDelta, -180, 180),
      }
    case "west":
      return {
        ...position,
        longitude: clamp(position.longitude - longitudeDelta, -180, 180),
      }
  }
}

function getGeocodingErrorMessage(error: unknown) {
  if (isNaverMapLoadError(error)) {
    switch (error.code) {
      case "missing-key":
        return "지도 설정이 완료되지 않아 위치를 찾을 수 없어요. 관리자에게 알려 주세요."
      case "auth-failed":
        return "지도 사용 권한을 확인하지 못했어요. 관리자에게 알려 주세요."
      case "load-failed":
        return "지도 연결을 준비하지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요."
    }
  }

  if (isGeocodingError(error)) {
    switch (error.code) {
      case "empty-query":
        return "도로명 주소를 입력한 뒤 위치를 찾아 주세요."
      case "no-results":
        return "입력한 주소의 위치를 찾지 못했어요. 도로명과 건물 번호를 확인해 주세요."
      case "invalid-coordinate":
        return "검색 결과의 위치 정보가 올바르지 않아요. 다른 주소로 다시 찾아 주세요."
      case "request-failed":
        return "지도 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."
    }
  }

  return "위치를 찾지 못했어요. 주소를 확인한 뒤 다시 시도해 주세요."
}

export function StoreFormFields({
  register,
  control,
  getValues,
  setValue,
  trigger,
  clearErrors,
  errors,
  idPrefix,
}: StoreFormFieldsProps) {
  const phoneField = register("phone")
  const addressField = register("address")
  const [latitude, longitude] = useWatch({
    control,
    name: ["latitude", "longitude"],
  })
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const geocodingRequestId = useRef(0)
  const position = useMemo<MapCoordinate | null>(
    () =>
      isLatitude(latitude) && isLongitude(longitude)
        ? { latitude, longitude }
        : null,
    [latitude, longitude],
  )
  const hasLatitude = latitude !== null && latitude !== undefined
  const hasLongitude = longitude !== null && longitude !== undefined
  const hasInvalidCoordinate =
    hasLatitude !== hasLongitude ||
    (hasLatitude && hasLongitude && position === null)
  const locationError =
    errors.latitude?.message ??
    errors.longitude?.message ??
    (hasInvalidCoordinate
      ? "저장된 위치 정보가 완전하지 않아요. 주소로 위치를 다시 찾아 주세요."
      : null)
  const locationSearchDescription = [
    errors.address ? `${idPrefix}-address-error` : `${idPrefix}-address-helper`,
    searchError ? `${idPrefix}-location-search-error` : null,
    locationError ? `${idPrefix}-location-error` : null,
  ]
    .filter(Boolean)
    .join(" ")

  const clearCoordinates = () => {
    geocodingRequestId.current += 1
    setIsSearching(false)
    setSearchError(null)
    setLocationStatus(null)
    setValue("latitude", null, { shouldDirty: true, shouldValidate: false })
    setValue("longitude", null, { shouldDirty: true, shouldValidate: false })
    clearErrors(["latitude", "longitude"])
  }

  const setCoordinates = (
    nextPosition: MapCoordinate,
    options: { status: string },
  ) => {
    setValue("latitude", normalizeCoordinate(nextPosition.latitude), {
      shouldDirty: true,
      shouldValidate: false,
    })
    setValue("longitude", normalizeCoordinate(nextPosition.longitude), {
      shouldDirty: true,
      shouldValidate: true,
    })
    clearErrors(["latitude", "longitude"])
    setSearchError(null)
    setLocationStatus(options.status)
  }

  const nudgePin = (direction: PinNudgeDirection) => {
    if (!position) return

    const directionLabel: Record<PinNudgeDirection, string> = {
      north: "북쪽",
      south: "남쪽",
      east: "동쪽",
      west: "서쪽",
    }
    setCoordinates(nudgeCoordinate(position, direction), {
      status: `핀을 ${directionLabel[direction]}으로 조금 이동했어요. 이 위치가 고객에게 픽업 장소로 보여요.`,
    })
  }

  const findLocation = async () => {
    if (!(await trigger("address"))) return

    const query = getValues("address").trim()
    const requestId = geocodingRequestId.current + 1
    geocodingRequestId.current = requestId
    setIsSearching(true)
    setSearchError(null)
    setLocationStatus(null)

    try {
      const result = await geocodeAddress(query)
      if (
        requestId !== geocodingRequestId.current ||
        getValues("address").trim() !== query
      ) {
        return
      }

      const resolvedAddress = result.roadAddress || result.jibunAddress || query
      setValue("address", resolvedAddress, {
        shouldDirty: true,
        shouldValidate: true,
      })
      setCoordinates(
        { latitude: result.latitude, longitude: result.longitude },
        {
          status:
            "주소의 위치를 찾았어요. 지도의 핀이 실제 픽업 장소와 맞는지 확인해 주세요.",
        },
      )
    } catch (error) {
      if (requestId === geocodingRequestId.current) {
        setSearchError(getGeocodingErrorMessage(error))
      }
    } finally {
      if (requestId === geocodingRequestId.current) {
        setIsSearching(false)
      }
    }
  }

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
            autoComplete="street-address"
            helper="도로명과 건물 번호까지 입력한 뒤 위치를 찾아 주세요."
            error={errors.address?.message}
            required
            {...addressField}
            onChange={(event) => {
              const previousAddress = getValues("address")
              void addressField.onChange(event)
              if (event.target.value !== previousAddress) {
                clearCoordinates()
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-fit"
            disabled={isSearching}
            aria-invalid={Boolean(searchError || locationError)}
            aria-describedby={locationSearchDescription}
            onClick={() => void findLocation()}
          >
            {isSearching ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Search aria-hidden="true" />
            )}
            {isSearching ? "위치를 찾는 중" : "주소로 위치 찾기"}
          </Button>

          <div>
            {position ? (
              <>
                <StoreLocationMap
                  position={position}
                  draggable
                  onPositionChange={(nextPosition) =>
                    setCoordinates(nextPosition, {
                      status:
                        "핀 위치를 조정했어요. 이 위치가 고객에게 픽업 장소로 보여요.",
                    })
                  }
                  ariaLabel="가게 픽업 위치 확인 지도"
                  className="h-72 w-full sm:h-80"
                />
                <p className="text-muted mt-2 text-sm leading-5">
                  핀을 움직여 실제 출입구 위치로 미세 조정할 수 있어요.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p
                    id={`${idPrefix}-pin-adjustment-helper`}
                    className="text-muted max-w-md text-sm leading-5"
                  >
                    화살표 버튼으로 핀을 약 2m씩 조정할 수 있어요.
                  </p>
                  <div
                    role="group"
                    aria-label="가게 핀 미세 조정"
                    aria-describedby={`${idPrefix}-pin-adjustment-helper`}
                    className="grid w-fit shrink-0 grid-cols-3 grid-rows-3 gap-1"
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="col-start-2 row-start-1"
                      aria-label="핀을 북쪽으로 조금 이동"
                      onClick={() => nudgePin("north")}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="col-start-1 row-start-2"
                      aria-label="핀을 서쪽으로 조금 이동"
                      onClick={() => nudgePin("west")}
                    >
                      <ArrowLeft aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="col-start-2 row-start-3"
                      aria-label="핀을 남쪽으로 조금 이동"
                      onClick={() => nudgePin("south")}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="col-start-3 row-start-2"
                      aria-label="핀을 동쪽으로 조금 이동"
                      onClick={() => nudgePin("east")}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="border-hairline bg-surface text-muted flex min-h-48 flex-col items-center justify-center rounded-xl border px-6 py-8 text-center">
                <span className="bg-canvas text-brand-link flex size-11 items-center justify-center rounded-xl">
                  <MapPin className="size-6" aria-hidden="true" />
                </span>
                <p className="text-foreground mt-3 text-sm font-semibold">
                  아직 확인한 픽업 위치가 없어요
                </p>
                <p className="mt-1 max-w-md text-sm leading-5">
                  도로명 주소를 입력하고 위치 찾기를 누르면 지도에 핀을
                  표시해요.
                </p>
              </div>
            )}
          </div>

          {isSearching ? (
            <p className="text-muted text-sm" role="status">
              네이버 지도에서 입력한 주소를 찾고 있어요.
            </p>
          ) : null}
          {locationStatus ? (
            <p className="text-success text-sm leading-5" role="status">
              {locationStatus}
            </p>
          ) : null}
          {searchError ? (
            <p
              id={`${idPrefix}-location-search-error`}
              className="text-critical text-sm leading-5"
              role="alert"
            >
              {searchError}
            </p>
          ) : null}
          {locationError ? (
            <p
              id={`${idPrefix}-location-error`}
              className="text-critical text-sm leading-5"
              role="alert"
            >
              {locationError}
            </p>
          ) : null}

          <input type="hidden" {...register("latitude")} />
          <input type="hidden" {...register("longitude")} />
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
