import { useState, type ReactNode } from "react";
import type { Track } from "@/lib/types";
import useSwipes from "../hooks/useSwipes";
import { SwipeContext, type SwipeFormOptions } from "./SwipeContext";

type SwipeProviderProps = {
  children?: ReactNode;
};

const SwipeProvider = ({ children }: SwipeProviderProps) => {
  const session = useSwipes<Track>();
  const [options, setOptions] = useState<SwipeFormOptions>({ backupEnabled: true });

  return (
    <SwipeContext.Provider value={{ session, options, setOptions }}>
      {children}
    </SwipeContext.Provider>
  );
};

export default SwipeProvider;
