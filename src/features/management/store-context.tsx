/* eslint-disable react-refresh/only-export-components -- 관리 셸과 페이지가 같은 가게 상태를 공유합니다. */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type ManagementStore = {
  id: string
  name: string
}

export const managementStores: ManagementStore[] = [
  { id: "seongsu", name: "성수 베이크샵" },
  { id: "geondae", name: "건대 디저트룸" },
]

type ManagementStoreContextValue = {
  store: ManagementStore
  setStoreId: (storeId: string) => void
}

const ManagementStoreContext =
  createContext<ManagementStoreContextValue | null>(null)

export function ManagementStoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState(managementStores[0].id)
  const store =
    managementStores.find((candidate) => candidate.id === storeId) ??
    managementStores[0]
  const value = useMemo(() => ({ store, setStoreId }), [store])

  return (
    <ManagementStoreContext.Provider value={value}>
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
