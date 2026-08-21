import { useEffect, useState } from "react"
import type { NaverMapLoadError } from "./map-errors"
import {
  loadNaverMaps,
  subscribeToNaverMapAuthFailure,
} from "./naver-map-loader"

type NaverMapsState =
  | { status: "loading"; maps: null; error: null }
  | { status: "ready"; maps: typeof naver.maps; error: null }
  | { status: "error"; maps: null; error: NaverMapLoadError }

const INITIAL_STATE: NaverMapsState = {
  status: "loading",
  maps: null,
  error: null,
}

export function useNaverMaps() {
  const [state, setState] = useState<NaverMapsState>(INITIAL_STATE)

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToNaverMapAuthFailure((error) => {
      if (active) {
        setState({ status: "error", maps: null, error })
      }
    })

    void loadNaverMaps().then(
      (maps) => {
        if (active) {
          setState({ status: "ready", maps, error: null })
        }
      },
      (error: NaverMapLoadError) => {
        if (active) {
          setState({ status: "error", maps: null, error })
        }
      },
    )

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return state
}
