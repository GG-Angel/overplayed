import { useState } from "react";

export type ReviewForm = {
  savePlaylist: boolean;
};

const initialForm: ReviewForm = {
  savePlaylist: true,
};

export const useReviewForm = () => {
  const [form, setForm] = useState<ReviewForm>(initialForm);

  const toggleSavePlaylist = () => {
    setForm((prev) => ({ ...prev, savePlaylist: !prev.savePlaylist }));
  };

  return { form, toggleSavePlaylist };
};
