import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LandingPage } from "./pages/landing";
import PlaylistSelectionPage from "./pages/playlists/selection";
import PlaylistSwipePage from "./pages/playlists/swipe";
import Layout from "@/components/Layout";
import ErrorState from "@/components/states/ErrorState";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
          { index: true, element: <PlaylistSelectionPage /> },
          { path: ":playlistId", element: <PlaylistSwipePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <ErrorState message="Page not found" /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
