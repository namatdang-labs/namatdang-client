import { zodResolver } from "@hookform/resolvers/zod"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { beforeEach, expect, test, vi } from "vitest"
import { GeocodingError, NaverMapLoadError } from "../map"
import { storeRegistrationFormSchema, type StoreFormValues } from "./schemas"
import { StoreFormFields } from "./store-form-fields"

const { geocodeAddressMock } = vi.hoisted(() => ({
  geocodeAddressMock: vi.fn(),
}))

vi.mock("../map", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../map")>()

  return {
    ...actual,
    geocodeAddress: geocodeAddressMock,
    StoreLocationMap: ({
      position,
      onPositionChange,
      ariaLabel = "가게 위치 확인 지도",
    }: {
      position: { latitude: number; longitude: number }
      onPositionChange?: (position: {
        latitude: number
        longitude: number
      }) => void
      ariaLabel?: string
    }) => (
      <div role="region" aria-label={ariaLabel}>
        <output>
          {position.latitude}, {position.longitude}
        </output>
        <button
          type="button"
          onClick={() =>
            onPositionChange?.({ latitude: 37.54321, longitude: 127.05678 })
          }
        >
          핀 위치 조정
        </button>
      </div>
    ),
  }
})

const emptyStoreValues: StoreFormValues = {
  name: "성수 오늘빵",
  phone: "02-1234-5678",
  address: "",
  addressDetail: "",
  description: "오늘 구운 빵을 준비해요.",
  latitude: null,
  longitude: null,
}

function StoreFormHarness({
  defaultValues = emptyStoreValues,
  onSubmit,
}: {
  defaultValues?: StoreFormValues
  onSubmit: (values: StoreFormValues) => void
}) {
  const {
    register,
    control,
    getValues,
    setValue,
    trigger,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeRegistrationFormSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StoreFormFields
        register={register}
        control={control}
        getValues={getValues}
        setValue={setValue}
        trigger={trigger}
        clearErrors={clearErrors}
        errors={errors}
        idPrefix="test-store"
      />
      <button type="submit">저장</button>
    </form>
  )
}

const geocodedAddress = {
  roadAddress: "서울 성동구 연무장길 18",
  jibunAddress: "서울 성동구 성수동2가 1-1",
  englishAddress: "18 Yeonmujang-gil, Seongdong-gu, Seoul",
  latitude: 37.54291234,
  longitude: 127.05481234,
}

beforeEach(() => {
  geocodeAddressMock.mockReset()
})

test("주소를 입력하는 동안은 검색하지 않고 명시적 행동 후 좌표 쌍을 저장한다", async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  geocodeAddressMock.mockResolvedValue(geocodedAddress)
  render(<StoreFormHarness onSubmit={onSubmit} />)

  const addressField = screen.getByRole("textbox", { name: /도로명 주소/ })
  await user.type(addressField, "서울 성동구 연무장길 18번지")
  expect(geocodeAddressMock).not.toHaveBeenCalled()

  await user.click(screen.getByRole("button", { name: "주소로 위치 찾기" }))

  expect(geocodeAddressMock).toHaveBeenCalledWith("서울 성동구 연무장길 18번지")
  expect(
    await screen.findByRole("region", { name: "가게 픽업 위치 확인 지도" }),
  ).toBeInTheDocument()
  expect(addressField).toHaveValue(geocodedAddress.roadAddress)
  expect(
    screen.getByText(
      "지도에서 핀을 드래그해 실제 출입구 위치로 조정할 수 있어요.",
    ),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole("group", { name: "가게 핀 미세 조정" }),
  ).not.toBeInTheDocument()

  await user.click(screen.getByRole("button", { name: "핀 위치 조정" }))
  await user.click(screen.getByRole("button", { name: "저장" }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalled()
  })
  expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
    address: geocodedAddress.roadAddress,
    latitude: 37.54321,
    longitude: 127.05678,
  })
})

test("확인한 주소 문자열이 바뀌면 이전 좌표를 즉시 무효화한다", async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  render(
    <StoreFormHarness
      defaultValues={{
        ...emptyStoreValues,
        address: geocodedAddress.roadAddress,
        latitude: geocodedAddress.latitude,
        longitude: geocodedAddress.longitude,
      }}
      onSubmit={onSubmit}
    />,
  )

  expect(
    screen.getByRole("region", { name: "가게 픽업 위치 확인 지도" }),
  ).toBeInTheDocument()
  const addressField = screen.getByRole("textbox", { name: /도로명 주소/ })
  await user.type(addressField, " 2")

  expect(
    screen.queryByRole("region", { name: "가게 픽업 위치 확인 지도" }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "저장" }))
  expect(
    await screen.findByText("주소로 위치를 찾은 뒤 지도에서 확인해 주세요."),
  ).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test("위치를 찾는 동안 로딩 상태를 보이고 결과가 오면 해제한다", async () => {
  const user = userEvent.setup()
  let resolveGeocoding: ((value: typeof geocodedAddress) => void) | undefined
  geocodeAddressMock.mockReturnValue(
    new Promise((resolve) => {
      resolveGeocoding = resolve
    }),
  )
  render(<StoreFormHarness onSubmit={vi.fn()} />)

  await user.type(
    screen.getByRole("textbox", { name: /도로명 주소/ }),
    "서울 성동구 연무장길 18",
  )
  await user.click(screen.getByRole("button", { name: "주소로 위치 찾기" }))

  expect(screen.getByRole("button", { name: "위치를 찾는 중" })).toBeDisabled()
  expect(
    screen.getByText("네이버 지도에서 입력한 주소를 찾고 있어요."),
  ).toBeInTheDocument()

  await act(async () => {
    resolveGeocoding?.(geocodedAddress)
  })

  expect(
    await screen.findByRole("button", { name: "주소로 위치 찾기" }),
  ).toBeEnabled()
})

test.each([
  [
    "검색 결과 없음",
    new GeocodingError("no-results"),
    "입력한 주소의 위치를 찾지 못했어요. 도로명과 건물 번호를 확인해 주세요.",
  ],
  [
    "API 키 누락",
    new NaverMapLoadError("missing-key"),
    "지도 설정이 완료되지 않아 위치를 찾을 수 없어요. 관리자에게 알려 주세요.",
  ],
])("%s 상태에서 다음 행동을 안내한다", async (_case, error, message) => {
  const user = userEvent.setup()
  geocodeAddressMock.mockRejectedValue(error)
  render(<StoreFormHarness onSubmit={vi.fn()} />)

  await user.type(
    screen.getByRole("textbox", { name: /도로명 주소/ }),
    "서울 성동구 연무장길 18",
  )
  await user.click(screen.getByRole("button", { name: "주소로 위치 찾기" }))

  expect(await screen.findByText(message)).toBeInTheDocument()
})
