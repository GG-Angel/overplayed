import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import LandingPage from "./pages/landing";
import PageLayout from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/features/user/auth/ProtectedRoute";
import SelectionPage from "./pages/playlists/selection";
import SwipeSongsPage from "./pages/playlists/swipe/songs";
import SwipeProvider from "@/features/swipe/provider/SwipeProvider";

const notFound = { path: "*", element: <ErrorState message="Page not found" /> };

const router = createBrowserRouter([
  {
    path: "/",
    Component: PageLayout,
    errorElement: <ErrorState />,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "playlists",
        Component: ProtectedRoute,
        children: [
          { index: true, Component: SelectionPage },
          {
            path: ":playlistId",
            Component: SwipeProvider,
            children: [
              {
                path: "swipe",
                Component: SwipeSongsPage,
              },
              notFound,
            ],
          },
        ],
      },
      notFound,
    ],
  },
]);

export const AppRouter = () => <RouterProvider router={router} />;
