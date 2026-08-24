import z from "zod";
import { playlistSchema } from "./spotify";

export const swipesFormSchema = z.object({
  uris: z.array(z.string()),
  tracks_swiped: z.number().int().nonnegative(),
  options: z.object({
    backup_enabled: z.boolean(),
    remove_from_likes: z.boolean(),
  }),
});

export const swipesSubmissionResultSchema = z.object({
  backup_playlist: playlistSchema.nullable(),
});

export const swipesLeaderboardSchema = z.array(
  z.object({
    user: z.object({
      id: z.string(),
      display_name: z.string().nullable(),
      picture_url: z.string().nullable(),
    }),
    metrics: z.object({
      total_swipes: z.number().int().nonnegative(),
      total_cuts: z.number().int().nonnegative(),
      cut_rate: z.number().nonnegative(),
    }),
  })
);

export type SwipesForm = z.infer<typeof swipesFormSchema>;
export type SwipesSubmissionResult = z.infer<typeof swipesSubmissionResultSchema>;
export type SwipesLeaderboard = z.infer<typeof swipesLeaderboardSchema>;
