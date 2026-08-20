import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  queueAccessResponseSchema,
  queueOverviewSchema,
  queueUserStatusSchema,
  type QueueAccessRequest,
} from "../types";
import { queueApi, queryKeys } from "./client";

const getQueueOverview = async () =>
  queueOverviewSchema.parse(await queueApi.get("/queue/overview"));

export const useQueueOverview = () =>
  useQuery({
    queryFn: getQueueOverview,
    queryKey: queryKeys.queueStatus(),
    staleTime: 2 * 60 * 1000,
  });

const getUserStatus = async (email: string) =>
  queueUserStatusSchema.parse(
    await queueApi.get(`/queue/users/${encodeURIComponent(email)}`)
  );

export const useUserStatus = (email: string | undefined) =>
  useQuery({
    queryKey: [...queryKeys.userAccess(), email],
    queryFn: () => {
      if (!email) throw new Error("No email provided");
      return getUserStatus(email);
    },
    enabled: !!email,
  });

const sendAccessRequest = async (form: QueueAccessRequest, turnstileToken: string) =>
  queueAccessResponseSchema.parse(
    await queueApi.post("/queue/requests", {
      ...form,
      "cf-turnstile-response": turnstileToken,
    })
  );

export const useSendAccessRequest = (form: QueueAccessRequest, turnstileToken: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => sendAccessRequest(form, turnstileToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.queue() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userAccess() }),
      ]);
    },
  });
};
