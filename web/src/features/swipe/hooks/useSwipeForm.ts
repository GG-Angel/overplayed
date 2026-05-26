import { useState } from "react";

export type SwipeForm = {
  savePlaylist: boolean;
};

const initialForm: SwipeForm = {
  savePlaylist: true,
};

export const useSwipeForm = () => {
  const [form, setForm] = useState<SwipeForm>(initialForm);

  const toggleSavePlaylist = () => {
    setForm((prev) => ({ ...prev, savePlaylist: !prev.savePlaylist }));
  };

  return { form, toggleSavePlaylist };
};
