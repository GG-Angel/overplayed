import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Logo from "./ui/Logo";
import UserMenu from "./UserMenu";
import AccessPill from "./AccessPill";

export const AppLayout = ({ children }: { children?: ReactNode }) => (
  <div className="flex flex-col h-svh">{children}</div>
);

export const Navbar = () => (
  <nav className="flex justify-between items-center py-2 gap-4">
    <Logo />
    <div className="flex items-center gap-3">
      <AccessPill />
      <UserMenu />
    </div>
  </nav>
);

export const PageLayout = () => (
  <>
    <Navbar />
    <div className="flex-1 min-h-0 flex flex-col">
      <Outlet />
    </div>
  </>
);
