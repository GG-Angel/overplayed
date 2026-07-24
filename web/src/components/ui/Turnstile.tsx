import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const TURNSTILE_ACTION = "turnstile-spin-v2";

type RenderOptions = {
  sitekey: string;
  action?: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (el: HTMLElement, options: RenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onTurnstileLoad?: () => void;
  }
}

let scriptPromise: Promise<void> | null = null;

const loadTurnstile = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Cloudflare Turnstile"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

type TurnstileProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
};

const Turnstile = ({ onVerify, onExpire, onError, className }: TurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onVerify, onExpire, onError });

  useEffect(() => {
    callbacks.current = { onVerify, onExpire, onError };
  });

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: env.CLOUDFLARE_SITE_KEY,
          action: TURNSTILE_ACTION,
          callback: (token) => callbacks.current.onVerify(token),
          "expired-callback": () => callbacks.current.onExpire?.(),
          "error-callback": () => callbacks.current.onError?.(),
        });
      })
      .catch(() => callbacks.current.onError?.());

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("cf-turnstile", className)}
      data-sitekey={env.CLOUDFLARE_SITE_KEY}
      data-action={TURNSTILE_ACTION}
    />
  );
};

export default Turnstile;
