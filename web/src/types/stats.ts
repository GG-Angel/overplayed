import z from "zod";

export const userStatsSchema = z.object({
  num_swipes: z.number().int().nonnegative(),
  num_modified: z.number().int().nonnegative(),
  num_cuts: z.number().int().nonnegative(),
  num_kept: z.number().int().nonnegative(),
  cut_rate: z.number().nonnegative(),
});

export const globalUserStatsSchema = z.object({
  total_sessions: z.number().int().nonnegative(),
  total_users: z.number().int().nonnegative(),
  total_swipes: z.number().int().nonnegative(),
  total_cuts: z.number().int().nonnegative(),
  cut_rate: z.number().nonnegative(),
});

export type UserStats = z.infer<typeof userStatsSchema>;
export type GlobalUserStats = z.infer<typeof globalUserStatsSchema>;
