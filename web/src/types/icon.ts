import type { ComponentType } from "react";

/**
 * Any component that renders an icon and accepts a className — covers both
 * `lucide-react` icons and the SVGR components imported via `*.svg?react`.
 */
export type IconComponent = ComponentType<{ className?: string }>;
