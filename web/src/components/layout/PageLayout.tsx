import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const PageLayout = () => {
  return (
    <>
      <Navbar />
      <div className="flex-1 min-h-0 flex flex-col">
        <Outlet />
      </div>
    </>
  );
};

export default PageLayout;
