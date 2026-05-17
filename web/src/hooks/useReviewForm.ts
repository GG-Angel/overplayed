import { useState } from "react";
import z from "zod";

const reviewFormSchema = z.object({
  savePlaylist: z.boolean(),
});

export type ReviewForm = z.infer<typeof reviewFormSchema>;

const initialForm: ReviewForm = {
  savePlaylist: true,
};

export const useReviewForm = () => {
  const [form, setForm] = useState<ReviewForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSavePlaylist = () => {
    setForm((prev) => ({ ...prev, savePlaylist: !prev.savePlaylist }));
  };

  const validate = (): { success: true; data: ReviewForm } | { success: false } => {
    const result = reviewFormSchema.safeParse(form);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        nextErrors[issue.path.join(".")] = issue.message;
      }
      setErrors(nextErrors);
      return { success: false };
    }

    setErrors({});
    return { success: true, data: result.data };
  };

  return {
    form,
    errors,
    validate,
    toggleSavePlaylist,
  };
};
