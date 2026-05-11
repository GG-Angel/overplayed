import Layout from "@/components/Layout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/landing";
import { ErrorPage } from "./pages/error";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PlaylistSelectionPage from "./pages/playlists/selection";
import PlaylistSwipePage from "./pages/playlists/swipe";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="/playlists" element={<ProtectedRoute />}>
            <Route index element={<PlaylistSelectionPage />} />
            <Route path="/playlists/:playlistId" element={<PlaylistSwipePage />} />
          </Route>
        </Route>
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
};
