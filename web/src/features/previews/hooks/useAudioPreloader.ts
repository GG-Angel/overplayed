import { useCallback, useEffect, useState } from "react";
import { AudioPreloader } from "../services/AudioPreloader";

const useAudioPreloader = (urls: string[]) => {
  const [preloader] = useState(() => new AudioPreloader());

  useEffect(() => {
    preloader.setWindow(urls);
  }, [preloader, urls]);

  useEffect(() => {
    return () => preloader.destroy();
  }, [preloader]);

  const get = useCallback((url: string) => preloader.get(url), [preloader]);

  return { get };
};

export default useAudioPreloader;
