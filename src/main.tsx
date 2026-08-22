import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { AppProviders } from "./app/providers"
import { registerPwaServiceWorker } from "./features/pwa/register-pwa"

window.addEventListener("load", () => {
  void registerPwaServiceWorker().catch(() => undefined)
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
