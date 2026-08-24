import z from "zod";

export const accessRequestFormSchema = z.object({
  email: z.email("Enter a valid email").trim(),
});

export const queueStatusSchema = z.object({
  total_slots: z.number().min(0),
  filled_slots: z.number().min(0),
  open_slots: z.number().min(0),
  num_waiting: z.number().min(0),
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

export const accessConfirmationPendingSchema = z.object({
  status: z.literal("confirmation_pending"),
  email: z.email(),
});

export const accessStatusSchema = z.discriminatedUnion("status", [
  accessActiveStatusSchema,
  accessInQueueSchema,
  accessConfirmationPendingSchema,
]);

export type QueueStatus = z.infer<typeof queueStatusSchema>;
export type AccessStatus = z.infer<typeof accessStatusSchema>;
export type AccessRequestForm = z.infer<typeof accessRequestFormSchema>;
