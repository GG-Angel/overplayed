import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import ErrorState from "@/components/states/ErrorState";
import LandingPage from "./pages/landing";
import PageLayout from "@/components/layout/PageLayout";
import { ProtectedRoute } from "@/features/user/auth/ProtectedRoute";

const NotFound = <Route path="*" element={<ErrorState message="Page Not Found" />} />;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" Component={PageLayout} errorElement={<ErrorState />}>
      <Route index Component={LandingPage} />
      <Route path="statistics" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("./pages/statistics")).default })}
        />
      </Route>
      <Route path="playlists" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("./pages/playlists/selection")).default })}
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
                Component: (await import("./pages/playlists/swipe/songs")).default,
              })}
            />
            <Route
              path="review"
              lazy={async () => ({
                Component: (await import("./pages/playlists/swipe/review")).default,
              })}
            />
            <Route
              path="submit"
              lazy={async () => ({
                Component: (await import("./pages/playlists/swipe/submit")).default,
              })}
            />
          </Route>
        </Route>
      </Route>
      {NotFound}
    </Route>
  )
);

export const AppRouter = () => <RouterProvider router={router} />;
