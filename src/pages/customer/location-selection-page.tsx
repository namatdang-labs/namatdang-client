import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { LoaderCircle, MapPin, Search } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router"

import {
  geocodeAddress,
  LocationPickerMap,
  reverseGeocodeCoordinate,
  type MapCoordinate,
} from "../../features/map"
import {
  FullscreenMapSearchForm,
  FullscreenMapShell,
  FullscreenMapTopOverlay,
} from "../../features/map/fullscreen-map-shell"
import {
  clearLocationPreference,
  readLocationPreference,
  saveLocationPreference,
  type LocationPreference,
} from "../../features/customer/location-preference"
import { getSafeInternalPath } from "../../shared/lib/safe-internal-path"
import { useDocumentTitle } from "../../shared/lib/use-document-title"
import { Button } from "../../shared/ui/button"

const DEFAULT_MAP_POSITION: MapCoordinate = {
  latitude: 37.5665,
  longitude: 126.978,
}

type AddressResolutionStatus = "loading" | "ready" | "error"

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  return "주소를 검색하지 못했어요. 도로명이나 동네 이름을 확인해 주세요."
}

export function LocationSelectionPage() {
  useDocumentTitle("위치 설정")
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = getSafeInternalPath(searchParams.get("returnTo"), "/app")
  const [initialPreference] = useState(readLocationPreference)
  const [mapPosition, setMapPosition] = useState<MapCoordinate>(() =>
    initialPreference
      ? {
          latitude: initialPreference.latitude,
          longitude: initialPreference.longitude,
        }
      : DEFAULT_MAP_POSITION,
  )
  const [resolvedPreference, setResolvedPreference] =
    useState<LocationPreference | null>(initialPreference)
  const [addressStatus, setAddressStatus] = useState<AddressResolutionStatus>(
    initialPreference ? "ready" : "loading",
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [saveError, setSaveError] = useState("")
  const latestResolutionId = useRef(0)
  const latestSearchId = useRef(0)
  const didResolveInitialPosition = useRef(false)

  const resolveCoordinate = useCallback(async (coordinate: MapCoordinate) => {
    const resolutionId = latestResolutionId.current + 1
    latestResolutionId.current = resolutionId
    setMapPosition(coordinate)
    setResolvedPreference(null)
    setAddressStatus("loading")
    setSaveError("")

    try {
      const result = await reverseGeocodeCoordinate(coordinate)
      if (resolutionId !== latestResolutionId.current) return

      setResolvedPreference({
        v: 1,
        latitude: result.coordinate.latitude,
        longitude: result.coordinate.longitude,
        label: result.label,
        address: result.address,
      })
      setAddressStatus("ready")
    } catch {
      if (resolutionId !== latestResolutionId.current) return
      setAddressStatus("error")
    }
  }, [])

  useEffect(() => {
    if (initialPreference || didResolveInitialPosition.current) return

    didResolveInitialPosition.current = true
    void resolveCoordinate(DEFAULT_MAP_POSITION)
  }, [initialPreference, resolveCoordinate])

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const searchId = latestSearchId.current + 1
    latestSearchId.current = searchId
    setSearchError("")
    setSaveError("")
    setIsSearching(true)

    try {
      const result = await geocodeAddress(searchQuery)
      if (searchId !== latestSearchId.current) return

      await resolveCoordinate({
        latitude: result.latitude,
        longitude: result.longitude,
      })
    } catch (error) {
      if (searchId !== latestSearchId.current) return
      setSearchError(getErrorMessage(error))
    } finally {
      if (searchId === latestSearchId.current) {
        setIsSearching(false)
      }
    }
  }

  const handleCenterSettled = (coordinate: MapCoordinate) => {
    latestSearchId.current += 1
    setIsSearching(false)
    setSearchError("")
    void resolveCoordinate(coordinate)
  }

  const handleSave = () => {
    if (!resolvedPreference || addressStatus !== "ready") return

    if (!saveLocationPreference(resolvedPreference)) {
      setSaveError(
        "이 브라우저에 위치를 저장하지 못했어요. 저장소 설정을 확인해 주세요.",
      )
      return
    }

    navigate(returnTo, { replace: true })
  }

  const handleCancel = () => {
    navigate(returnTo, { replace: true })
  }

  const handleClear = () => {
    clearLocationPreference()
    navigate(returnTo, { replace: true })
  }

  return (
    <FullscreenMapShell
      backLabel="위치 설정 취소"
      description="지도를 움직여 가운데 핀을 원하는 동네에 놓아 주세요."
      title="지도에서 위치 설정"
      onBack={handleCancel}
      footer={
        <>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3" aria-live="polite">
              <span className="bg-brand-tint text-brand-brown flex size-10 shrink-0 items-center justify-center rounded-xl">
                {addressStatus === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                    size={20}
                  />
                ) : (
                  <MapPin aria-hidden="true" size={20} />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-foreground font-semibold">
                  {addressStatus === "loading"
                    ? "지도 중심의 주소를 확인하고 있어요"
                    : addressStatus === "error"
                      ? "선택한 위치의 주소를 확인하지 못했어요"
                      : resolvedPreference?.label}
                </p>
                <p className="text-muted mt-1 text-sm leading-5">
                  {addressStatus === "error"
                    ? "지도를 조금 옮기거나 주소를 다시 검색해 주세요."
                    : (resolvedPreference?.address ??
                      "서울시청 주변을 처음으로 보여드리고 있어요.")}
                </p>
                <p className="text-brand-link mt-1 text-xs font-semibold">
                  설정하면 이 위치에서 5km 안의 가게를 보여드려요.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              {initialPreference ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleClear}
                >
                  전체 지역으로 보기
                </Button>
              ) : null}
              <Button
                type="button"
                className="w-full sm:w-auto sm:min-w-40"
                disabled={
                  isSearching ||
                  !resolvedPreference ||
                  addressStatus !== "ready"
                }
                onClick={handleSave}
              >
                이 위치로 설정
              </Button>
            </div>
          </div>
          {saveError ? (
            <p
              className="text-critical mx-auto mt-3 w-full max-w-3xl text-sm"
              role="alert"
            >
              {saveError}
            </p>
          ) : null}
        </>
      }
    >
      <LocationPickerMap
        initialPosition={mapPosition}
        onCenterSettled={handleCenterSettled}
        ariaLabel="선택할 위치를 정하는 지도"
        className="h-full min-h-0 w-full rounded-none border-0"
      />

      <FullscreenMapTopOverlay>
        <FullscreenMapSearchForm onSubmit={handleSearch}>
          <label htmlFor="location-address-search" className="sr-only">
            주소 또는 동네 검색
          </label>
          <Search aria-hidden="true" className="text-muted ml-2" size={20} />
          <input
            id="location-address-search"
            type="search"
            value={searchQuery}
            maxLength={80}
            autoComplete="street-address"
            placeholder="도로명, 지번, 동네 이름 검색"
            className="text-foreground placeholder:text-disabled min-h-11 min-w-0 flex-1 rounded bg-transparent px-1 text-base"
            aria-describedby={searchError ? "location-search-error" : undefined}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Button
            type="submit"
            size="compact"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : null}
            검색
          </Button>
        </FullscreenMapSearchForm>

        {searchError ? (
          <p
            id="location-search-error"
            className="bg-canvas text-critical border-critical pointer-events-auto rounded-xl border px-4 py-3 text-sm"
            role="alert"
          >
            {searchError}
          </p>
        ) : null}
      </FullscreenMapTopOverlay>
    </FullscreenMapShell>
  )
}
