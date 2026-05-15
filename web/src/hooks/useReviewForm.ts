import { useState } from "react";
import z from "zod";

const reviewFormSchema = z.object({
  savePlaylist: z.discriminatedUnion("enabled", [
    z.object({
      enabled: z.literal(false),
    }),
    z.object({
      enabled: z.literal(true),
      name: z.string().min(1, "Name is required").max(100, "Name is too long"),
      description: z.string().max(300, "Description is too long"),
    }),
  ]),
});

export type ReviewForm = z.infer<typeof reviewFormSchema>;

type SavePlaylistFields = Extract<ReviewForm["savePlaylist"], { enabled: true }>;

const initialForm: ReviewForm = {
  savePlaylist: { enabled: true, name: "Overplayed Tracks", description: "" },
};

export const useReviewForm = () => {
  const [form, setForm] = useState<ReviewForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleSavePlaylist = () => {
    setForm((prev) => ({
      savePlaylist: prev.savePlaylist.enabled
        ? { enabled: false }
        : {
            enabled: true,
            name: initialForm.savePlaylist.enabled ? initialForm.savePlaylist.name : "",
            description: "",
          },
    }));
  };

  const updateSavePlaylistFields = (patch: Partial<Omit<SavePlaylistFields, "enabled">>) => {
    setForm((prev) => {
      if (!prev.savePlaylist.enabled) return prev;
      return {
        savePlaylist: { ...prev.savePlaylist, ...patch },
      };
    });
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
    toggleSavePlaylist,
    updateSavePlaylistFields,
    validate,
  };
};
