import { useEffect } from "react";
import confetti from "canvas-confetti";

const useConfetti = () => {
  useEffect(() => {
    const common = { particleCount: 20, spread: 55, colors: ["#1ed760"] };
    const frame = () => {
      confetti({ ...common, angle: 60, origin: { x: 0 } });
      confetti({ ...common, angle: 120, origin: { x: 1 } });
    };
    frame();
  }, []);
};

export default useConfetti;
