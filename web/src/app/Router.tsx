import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import type { ComponentType } from "react";
import ErrorState from "@/components/states/ErrorState";
import LandingPage from "../pages/LandingPage";
import PageLayout from "@/components/layout/PageLayout";
import LoadingState from "@/components/states/LoadingState";
import { ProtectedRoute } from "@/features/session/auth/ProtectedRoute";

const NotFound = <Route path="*" element={<ErrorState message="Page not found" />} />;

const lazyComponent = (importer: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await importer()).default,
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      Component={PageLayout}
      errorElement={<ErrorState />}
      hydrateFallbackElement={<LoadingState />}
    >
      <Route index Component={LandingPage} />
      <Route path="access" lazy={lazyComponent(() => import("../pages/AccessPage"))} />
      <Route path="statistics" Component={ProtectedRoute}>
        <Route index lazy={lazyComponent(() => import("../pages/StatsPage"))} />
      </Route>
      <Route path="playlists" Component={ProtectedRoute}>
        <Route index lazy={lazyComponent(() => import("../pages/PlaylistSelectionPage"))} />
        <Route path=":playlistId">
          <Route
            path="swipe"
            lazy={lazyComponent(() => import("@/features/swipe/provider/SwipeProvider"))}
          >
            <Route
              index
              lazy={lazyComponent(() => import("../pages/playlists/swipe/SwipeSongsPage"))}
            />
            <Route
              path="review"
              lazy={lazyComponent(() => import("../pages/playlists/swipe/ReviewSwipesPage"))}
            />
            <Route
              path="submit"
              lazy={lazyComponent(() => import("../pages/playlists/swipe/SwipeSubmitPage"))}
            />
            {NotFound}
          </Route>
          {NotFound}
        </Route>
      </Route>
      {NotFound}
    </Route>
  )
);

export const AppRouter = () => <RouterProvider router={router} />;
