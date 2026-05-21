import { useState } from "react";

const useTimer = () => {
  const [start] = useState(() => Date.now());

  const stop = () => {
    return Date.now() - start;
  };

  return { stop };
};

export default useTimer;
