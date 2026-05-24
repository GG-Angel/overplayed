import { useState } from "react";

const useTimer = () => {
  const [start] = useState(() => new Date());

  const stop = () => ({
    startedAt: start.toISOString(),
    durationMs: Date.now() - start.getTime(),
  });

  return { stop };
};

export default useTimer;
