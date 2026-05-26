import type { ReactNode } from "react";

type AppLayoutProps = {
  children?: ReactNode;
};

const AppLayout = ({ children }: AppLayoutProps) => {
  return <div className="flex flex-col h-svh">{children}</div>;
};

export default AppLayout;
