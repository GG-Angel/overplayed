import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useMutationState,
  useQueryClient,
  type MutationState,
} from "@tanstack/react-query";
import { submitSwipes, useTrackPreviewUrls } from "../../api/swipes";
import { queryKeys } from "../../api/client";
import { removeFromStorage, storageKeys } from "../../storage";
import type { SwipeSubmissionResponse, Track } from "../../types";
import { useSwipeSession } from "./SwipeSession";

class AudioPreloader {
  private cache = new Map<string, HTMLAudioElement>();

  setWindow(urls: string[]) {
    const keep = new Set(urls);
    for (const [url, audio] of this.cache) {
      if (!keep.has(url)) {
        this.dispose(audio);
        this.cache.delete(url);
      }
    }
    for (const url of urls) {
      if (!this.cache.has(url)) this.cache.set(url, this.create(url));
    }
  }

  get(url: string): HTMLAudioElement {
    let audio = this.cache.get(url);
    if (!audio) {
      audio = this.create(url);
      this.cache.set(url, audio);
    }
    return audio;
  }

  destroy() {
    for (const audio of this.cache.values()) this.dispose(audio);
    this.cache.clear();
  }

  private create(url: string) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    audio.load();
    return audio;
  }

  private dispose(audio: HTMLAudioElement) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
}

const useAudioPreloader = (urls: string[]) => {
  const [preloader] = useState(() => new AudioPreloader());
  useEffect(() => preloader.setWindow(urls), [preloader, urls]);
  useEffect(() => () => preloader.destroy(), [preloader]);
  const get = useCallback((url: string) => preloader.get(url), [preloader]);
  return { get };
};

const PRELOAD_RADIUS = 5;

export const usePreloadSwipePreviews = (tracks: Track[], index: number) => {
  const preloadIsrcs = tracks
    .slice(Math.max(0, index - PRELOAD_RADIUS), index + PRELOAD_RADIUS)
    .map((track) => track.external_ids.isrc);
  const previewQueries = useTrackPreviewUrls(preloadIsrcs);
  const previewUrls = previewQueries
    .map((query) => query.data?.url)
    .filter((url) => url != null);
  return useAudioPreloader(previewUrls);
};

export const useSubmitSwipes = () => {
  const queryClient = useQueryClient();
  const { playlist, options, session, setHasSubmitted } = useSwipeSession();
  const hasDislikes = session.dislikes.length > 0;
  const mutationKey = useMemo(() => ["submit-swipes", playlist.id] as const, [playlist.id]);
  const { mutate } = useMutation({
    mutationKey,
    mutationFn: () =>
      submitSwipes(playlist.id, {
        options,
        uris: session.dislikes.map((track) => track.uri),
        tracks_swiped: session.swipes.length,
      }),
    onSuccess: async () => {
      setHasSubmitted(true);
      removeFromStorage(sessionStorage, storageKeys.swipes(playlist.id, playlist.snapshot_id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists(), refetchType: "none" }),
        queryClient.invalidateQueries({ queryKey: queryKeys.metrics(), refetchType: "none" }),
      ]);
    },
  });
  const submission = useMutationState({
    filters: { mutationKey, exact: true },
    select: (mutation) => mutation.state as MutationState<SwipeSubmissionResponse>,
  }).at(-1);
  useEffect(() => {
    if (!hasDislikes) return;
    if (queryClient.getMutationCache().find({ mutationKey, exact: true })) return;
    mutate();
  }, [hasDislikes, mutate, mutationKey, queryClient]);
  return {
    hasDislikes,
    isError: submission?.status === "error",
    isSuccess: submission?.status === "success",
    data: submission?.data,
    retry: () => mutate(),
  };
};
