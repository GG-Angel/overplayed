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
import SelectionPage from "./pages/playlists/selection";
import SwipeSongsPage from "./pages/playlists/swipe/songs";
import SwipeProvider from "@/features/swipe/provider/SwipeProvider";
import SwipeReviewPage from "./pages/playlists/swipe/review";
import SwipeSubmitPage from "./pages/playlists/swipe/submit";

const NotFound = <Route path="*" element={<ErrorState message="Page not found" />} />;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" Component={PageLayout} errorElement={<ErrorState />}>
      <Route index Component={LandingPage} />
      <Route path="playlists" Component={ProtectedRoute}>
        <Route index Component={SelectionPage} />
        <Route path=":playlistId">
          <Route path="swipe" Component={SwipeProvider}>
            <Route index Component={SwipeSongsPage} />
            <Route path="review" Component={SwipeReviewPage} />
            <Route path="submit" Component={SwipeSubmitPage} />
          </Route>
        </Route>
      </Route>
      {NotFound}
    </Route>
  )
);

export const AppRouter = () => <RouterProvider router={router} />;
