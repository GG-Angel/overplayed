import { createBrowserRouter, RouterProvider } from "react-router-dom";
import SelectionPage from "./pages/playlists/selection";
import ErrorState from "@/components/states/ErrorState";
import { ProtectedRoute } from "@/features/user/auth/ProtectedRoute";
import SwipePage from "./pages/playlists/swipe";
import LandingPage from "./pages/landing";
import Layout from "@/components/layout/Layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorState />,
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
]);

export const AppRouter = () => <RouterProvider router={router} />;
