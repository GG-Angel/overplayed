import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import LandingPage from "../pages/LandingPage";
import PageLayout from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/features/user/auth/ProtectedRoute";
import LoadingState from "@/components/states/LoadingState";

const NotFound = <Route path="*" element={<ErrorState message="Page not found" />} />;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      Component={PageLayout}
      errorElement={<ErrorState />}
      hydrateFallbackElement={<LoadingState />}
    >
      <Route index Component={LandingPage} />
      <Route
        path="access"
        lazy={async () => ({
          Component: (await import("../pages/AccessPage")).default,
        })}
      />
      <Route path="statistics" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("../pages/StatsPage")).default })}
        />
      </Route>
      <Route path="playlists" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("../pages/playlists/PlaylistSelectionPage")).default })}
        />
        <Route path=":playlistId">
          <Route
            path="swipe"
            lazy={async () => ({
              Component: (await import("@/features/swipe/provider/SwipeProvider")).default,
            })}
          >
            <Route
              index
              lazy={async () => ({
                Component: (await import("../pages/playlists/swipe/SwipeSongsPage")).default,
              })}
            />
            <Route
              path="review"
              lazy={async () => ({
                Component: (await import("../pages/playlists/swipe/ReviewSwipesPage")).default,
              })}
            />
            <Route
              path="submit"
              lazy={async () => ({
                Component: (await import("../pages/playlists/swipe/SwipeSubmitPage")).default,
              })}
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
