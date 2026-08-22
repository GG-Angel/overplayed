import z from "zod";

export const accessRequestFormSchema = z.object({
  email: z.email("Enter a valid email").trim(),
});

export const queueStatusSchema = z.object({
  num_active: z.number().min(0),
  num_queued: z.number().min(0),
  user_limit: z.number().min(0),
  next_available_time: z.iso.datetime().nullable(),
});

export const accessActiveStatusSchema = z.object({
  status: z.literal("active"),
  email: z.email(),
  estimated_end_time: z.iso.datetime(),
});

export const accessInQueueSchema = z.object({
  status: z.literal("in_queue"),
  email: z.email(),
  position_in_queue: z.number().int(),
  estimated_start_time: z.iso.datetime(),
});

export const accessConfirmationSentSchema = z.object({
  status: z.literal("confirmation_sent"),
  email: z.email(),
});

export const accessConfirmationPendingSchema = z.object({
  status: z.literal("confirmation_pending"),
  email: z.email(),
});

export const accessStatusSchema = z.discriminatedUnion("status", [
  accessActiveStatusSchema,
  accessInQueueSchema,
]);

export const accessRequestResultSchema = z.discriminatedUnion("status", [
  accessConfirmationSentSchema,
  accessConfirmationPendingSchema,
  accessStatusSchema,
]);

export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type AccessStatus = z.infer<typeof accessStatusSchema>;
export type AccessRequestForm = z.infer<typeof accessRequestFormSchema>;
export type AccessRequestResult = z.infer<typeof accessRequestResultSchema>;
