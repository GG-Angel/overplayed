import { useEffect, useState } from "react";
import { AudioPreloader } from "../services/AudioPreloader";

const useAudioPreloader = () => {
  const [preloader] = useState(() => new AudioPreloader());

  useEffect(() => {
    return () => preloader.destroy();
  }, [preloader]);

  return preloader;
};

export default useAudioPreloader;
