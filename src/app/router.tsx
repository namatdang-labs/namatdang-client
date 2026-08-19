import { createBrowserRouter } from "react-router"
import { AuthLayout } from "../layouts/auth-layout"
import { CustomerLayout } from "../layouts/customer-layout"
import { ManagementLayout } from "../layouts/management-layout"
import { ManagementSetupLayout } from "../layouts/management-setup-layout"
import { RootLayout } from "../layouts/root-layout"
import { RouteErrorBoundary } from "../pages/system/route-error-boundary"
import { RouteLoadingFallback } from "../pages/system/route-loading-fallback"
import { requireAuthentication } from "./auth-loader"

const loadLoginPage = async () => {
  const { LoginPage } = await import("../pages/auth/login-page")
  return { Component: LoginPage }
}

const loadSignupPage = async () => {
  const { SignupPage } = await import("../pages/auth/signup-page")
  return { Component: SignupPage }
}

const loadHomePage = async () => {
  const { HomePage } = await import("../pages/customer/home-page")
  return { Component: HomePage }
}

const loadFavoritesPage = async () => {
  const { FavoritesPage } = await import("../pages/customer/favorites-page")
  return { Component: FavoritesPage }
}

const loadNotificationsPage = async () => {
  const { NotificationsPage } =
    await import("../pages/customer/notifications-page")
  return { Component: NotificationsPage }
}

const loadStoreDetailPage = async () => {
  const { StoreDetailPage } =
    await import("../pages/customer/store-detail-page")
  return { Component: StoreDetailPage }
}

const loadDealDetailPage = async () => {
  const { DealDetailPage } = await import("../pages/customer/deal-detail-page")
  return { Component: DealDetailPage }
}

const loadReservationCompletePage = async () => {
  const { ReservationCompletePage } =
    await import("../pages/customer/reservation-complete-page")
  return { Component: ReservationCompletePage }
}

const loadReservationsPage = async () => {
  const { ReservationsPage } =
    await import("../pages/customer/reservations-page")
  return { Component: ReservationsPage }
}

const loadReservationDetailPage = async () => {
  const { ReservationDetailPage } =
    await import("../pages/customer/reservation-detail-page")
  return { Component: ReservationDetailPage }
}

const loadMyPage = async () => {
  const { MyPage } = await import("../pages/account/my-page")
  return { Component: MyPage }
}

const loadManagementOnboardingPage = async () => {
  const { ManagementOnboardingPage } =
    await import("../pages/management/management-onboarding-page")
  return { Component: ManagementOnboardingPage }
}

const loadStoreRegistrationPage = async () => {
  const { StoreRegistrationPage } =
    await import("../pages/management/store-registration-page")
  return { Component: StoreRegistrationPage }
}

const loadManagementHomePage = async () => {
  const { ManagementHomePage } =
    await import("../pages/management/management-home-page")
  return { Component: ManagementHomePage }
}

const loadManagementDealsPage = async () => {
  const { ManagementDealsPage } =
    await import("../pages/management/management-deals-page")
  return { Component: ManagementDealsPage }
}

const loadDealFormPage = async () => {
  const { DealFormPage } = await import("../pages/management/deal-form-page")
  return { Component: DealFormPage }
}

const loadManagementReservationsPage = async () => {
  const { ManagementReservationsPage } =
    await import("../pages/management/management-reservations-page")
  return { Component: ManagementReservationsPage }
}

const loadStoreSettingsPage = async () => {
  const { StoreSettingsPage } =
    await import("../pages/management/store-settings-page")
  return { Component: StoreSettingsPage }
}

export const router = createBrowserRouter([
  {
    id: "root",
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    HydrateFallback: RouteLoadingFallback,
    children: [
      {
        Component: AuthLayout,
        children: [
          { path: "login", lazy: loadLoginPage },
          { path: "signup", lazy: loadSignupPage },
        ],
      },
      {
        Component: CustomerLayout,
        loader: requireAuthentication,
        children: [
          { index: true, lazy: loadHomePage },
          { path: "favorites", lazy: loadFavoritesPage },
          { path: "notifications", lazy: loadNotificationsPage },
          { path: "stores/:storeId", lazy: loadStoreDetailPage },
          { path: "deals/:dealId", lazy: loadDealDetailPage },
          {
            path: "reservations/complete",
            lazy: loadReservationCompletePage,
          },
          { path: "reservations", lazy: loadReservationsPage },
          {
            path: "reservations/:reservationId",
            lazy: loadReservationDetailPage,
          },
          { path: "me", lazy: loadMyPage },
        ],
      },
      {
        Component: ManagementSetupLayout,
        loader: requireAuthentication,
        children: [
          {
            path: "manage/onboarding",
            lazy: loadManagementOnboardingPage,
          },
          { path: "manage/register", lazy: loadStoreRegistrationPage },
        ],
      },
      {
        path: "manage",
        Component: ManagementLayout,
        loader: requireAuthentication,
        children: [
          { index: true, lazy: loadManagementHomePage },
          { path: "deals", lazy: loadManagementDealsPage },
          { path: "deals/new", lazy: loadDealFormPage },
          { path: "deals/:dealId/edit", lazy: loadDealFormPage },
          { path: "reservations", lazy: loadManagementReservationsPage },
          { path: "store", lazy: loadStoreSettingsPage },
        ],
      },
    ],
  },
])
