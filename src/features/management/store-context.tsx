/* eslint-disable react-refresh/only-export-components -- 관리 셸과 페이지가 같은 가게 상태를 공유합니다. */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { Navigate } from "react-router"

import { Button } from "../../shared/ui/button"
import { useOwnerStores, type OwnerStore } from "./store-api"

export type ManagementStore = Omit<OwnerStore, "id"> & {
  id: string
}

type ManagementStoreContextValue = {
  store: ManagementStore
  stores: ManagementStore[]
  setStoreId: (storeId: string) => void
}

const ManagementStoreContext =
  createContext<ManagementStoreContextValue | null>(null)

export function ManagementStoreProvider({ children }: { children: ReactNode }) {
  const storesQuery = useOwnerStores()
  const stores = useMemo(
    () =>
      (storesQuery.data ?? []).map((store) => ({
        ...store,
        id: String(store.id),
      })),
    [storesQuery.data],
  )
  const [storeId, setStoreId] = useState("")
  const store =
    stores.find((candidate) => candidate.id === storeId) ?? stores[0]

  if (storesQuery.isPending) {
    return (
      <div
        className="bg-background text-muted flex min-h-svh items-center justify-center px-6 text-sm"
        role="status"
      >
        내 가게 정보를 불러오는 중이에요.
      </div>
    )
  }

  if (storesQuery.isError && stores.length === 0) {
    return (
      <div className="bg-background flex min-h-svh items-center justify-center px-6">
        <section className="border-hairline bg-canvas max-w-md rounded-2xl border p-6 text-center">
          <h1 className="text-foreground text-xl font-bold">
            가게 정보를 불러오지 못했어요
          </h1>
          <p className="text-muted mt-2 text-sm leading-6">
            네트워크 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-5"
            onClick={() => void storesQuery.refetch()}
          >
            다시 시도
          </Button>
        </section>
      </div>
    )
  }

  if (!store) {
    return <Navigate to="/manage/onboarding" replace />
  }

  const value: ManagementStoreContextValue = {
    store,
    stores,
    setStoreId,
  }

  return (
    <ManagementStoreContext.Provider value={value}>
      {storesQuery.isError ? (
        <p
          className="border-warning/30 bg-canvas text-foreground fixed right-4 bottom-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm"
          role="status"
        >
          최신 가게 정보를 다시 확인하지 못해 저장된 정보를 보여 드리고 있어요.
        </p>
      ) : null}
      {children}
    </ManagementStoreContext.Provider>
  )
}

export function useManagementStore() {
  const context = useContext(ManagementStoreContext)

  if (!context) {
    throw new Error(
      "useManagementStore must be used within ManagementStoreProvider",
    )
  }

  return context
}
