import Layout from "@/components/Layout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./pages/landing";
import { NotFound } from "./pages/not-found";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PlaylistSelection from "./pages/playlists/selection";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="/playlists" element={<ProtectedRoute />}>
            <Route index element={<PlaylistSelection />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
