import { useEffect } from "react"

const PRODUCT_NAME = "남았당"

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${PRODUCT_NAME}` : PRODUCT_NAME
  }, [title])
}
