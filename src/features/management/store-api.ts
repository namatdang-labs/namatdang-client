import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "../../shared/api/client"
import { customerQueryKeys } from "../customer/customer-api"

export type OwnerStore = {
  id: number
  name: string
  address: string
  addressDetail: string | null
  phoneNumber: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
}

export type StoreWriteRequest = {
  name: string
  address: string
  addressDetail?: string | null
  phoneNumber?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
}

export const ownerStoreKeys = {
  all: ["owner", "stores"] as const,
}

export function getOwnerStores() {
  return apiClient.get<OwnerStore[]>("owner/stores")
}

export function createOwnerStore(request: StoreWriteRequest) {
  return apiClient.post<OwnerStore>("owner/stores", request)
}

export function updateOwnerStore(storeId: number, request: StoreWriteRequest) {
  return apiClient.patch<OwnerStore>(`owner/stores/${storeId}`, request)
}

export function useOwnerStores() {
  return useQuery({
    queryKey: ownerStoreKeys.all,
    queryFn: getOwnerStores,
  })
}

export function useCreateOwnerStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOwnerStore,
    onSuccess: async (createdStore) => {
      queryClient.setQueryData<OwnerStore[]>(ownerStoreKeys.all, (current) => {
        const stores = current ?? []
        return stores.some((store) => store.id === createdStore.id)
          ? stores.map((store) =>
              store.id === createdStore.id ? createdStore : store,
            )
          : [...stores, createdStore]
      })
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      await queryClient.invalidateQueries({
        queryKey: ["customer", "stores"],
      })
    },
  })
}

export function useUpdateOwnerStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      storeId,
      request,
    }: {
      storeId: number
      request: StoreWriteRequest
    }) => updateOwnerStore(storeId, request),
    onSuccess: async (updatedStore, variables) => {
      queryClient.setQueryData<OwnerStore[]>(ownerStoreKeys.all, (current) =>
        current?.map((store) =>
          store.id === updatedStore.id ? updatedStore : store,
        ),
      )
      await queryClient.invalidateQueries({ queryKey: ownerStoreKeys.all })
      await queryClient.invalidateQueries({
        queryKey: ["customer", "stores"],
      })
      await queryClient.invalidateQueries({
        queryKey: customerQueryKeys.store(variables.storeId),
      })
      await queryClient.invalidateQueries({
        queryKey: customerQueryKeys.favorites,
      })
    },
  })
}
