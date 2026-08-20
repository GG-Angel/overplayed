import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import { ErrorState, LoadingState } from "@/components/PageState";
import HomePage from "@/pages/HomePage";
import { PageLayout } from "@/components/Layout";
import { ProtectedRoute } from "./auth";

const NotFound = <Route path="*" element={<ErrorState message="Page Not Found" />} />;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      Component={PageLayout}
      errorElement={<ErrorState />}
      hydrateFallbackElement={<LoadingState />}
    >
      <Route index Component={HomePage} />
      <Route
        path="access"
        lazy={async () => ({
          Component: (await import("../pages/AccessPage")).default,
        })}
      />
      <Route path="statistics" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("../pages/StatisticsPage")).default })}
        />
      </Route>
      <Route path="playlists" Component={ProtectedRoute}>
        <Route
          index
          lazy={async () => ({ Component: (await import("../pages/PlaylistsPage")).default })}
        />
        <Route path=":playlistId">
          <Route
            path="swipe"
            lazy={async () => ({
              Component: (await import("@/features/swipe/SwipeSession")).default,
            })}
          >
            <Route
              index
              lazy={async () => ({
                Component: (await import("../pages/SwipePage")).default,
              })}
            />
            <Route
              path="review"
              lazy={async () => ({
                Component: (await import("../pages/ReviewPage")).default,
              })}
            />
            <Route
              path="submit"
              lazy={async () => ({
                Component: (await import("../pages/SubmitPage")).default,
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
