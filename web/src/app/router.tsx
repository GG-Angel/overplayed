import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SelectionPage from "./pages/playlists/selection";
import ErrorState from "@/components/states/ErrorState";
import { ProtectedRoute } from "@/features/user/auth/ProtectedRoute";
import SwipePage from "./pages/playlists/swipe";
import LandingPage from "./pages/landing";
import PageLayout from "@/components/layout/PageLayout";

const router = createBrowserRouter([
  {
    errorElement: <ErrorState />,
    children: [
      {
        element: <PageLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          {
            path: "playlists",
            element: <ProtectedRoute />,
            children: [
              { index: true, element: <SelectionPage /> },
              { path: ":playlistId", element: <SwipePage /> },
            ],
          },
        ],
      },
      { path: "*", element: <ErrorState message="Page not found" /> },
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
