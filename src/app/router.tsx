import { createBrowserRouter } from "react-router"
import { CustomerLayout } from "../layouts/customer-layout"
import { ManagementLayout } from "../layouts/management-layout"
import { RootLayout } from "../layouts/root-layout"
import { DealDetailPage } from "../pages/customer/deal-detail-page"
import { HomePage } from "../pages/customer/home-page"
import { ReservationReviewPage } from "../pages/customer/reservation-review-page"
import { ManagementHomePage } from "../pages/management/management-home-page"
import { RouteErrorBoundary } from "../pages/system/route-error-boundary"

export const router = createBrowserRouter([
  {
    id: "root",
    Component: RootLayout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: CustomerLayout,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: "deals/:dealId",
            Component: DealDetailPage,
          },
          {
            path: "reservations/review",
            Component: ReservationReviewPage,
          },
        ],
      },
      {
        path: "manage",
        Component: ManagementLayout,
        children: [
          {
            index: true,
            Component: ManagementHomePage,
          },
        ],
      },
    ],
  },
])
