import Layout from "@/components/Layout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./routes/landing";
import { NotFound } from "./routes/not-found";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
