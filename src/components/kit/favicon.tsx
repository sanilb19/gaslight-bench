import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaviconProps = {
  /** A bare domain, e.g. "github.com". */
  domain: string;
  /**
   * Override the domain favicon with a specific Iconify icon id, e.g.
   * "logos:google-gmail". Use where a domain favicon is the wrong mark —
   * Google's products all serve the same generic "G".
   */
  iconify?: string;
  size?: number;
  /** Accessible/alt label. */
  label?: string;
  className?: string;
};

function faviconSrc({
  domain,
  iconify,
  size,
}: {
  domain: string;
  iconify?: string;
  size: number;
}): string {
  if (iconify) {
    const [prefix, name] = iconify.split(":");
    return `https://api.iconify.design/${prefix}/${name}.svg`;
  }
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size * 2}`;
}

/**
 * A brand mark for a site/service — the live favicon by domain, with a globe
 * fallback when the image fails. The standard way to show third-party brands
 * (link lists, integrations), future-proof as logos change.
 * Demo: `/_design`.
 */
export function Favicon({
  domain,
  iconify,
  size = 20,
  label,
  className,
}: FaviconProps) {
  const [error, setError] = useState(false);
  // Reset the failure state when the source changes by adjusting state during
  // render — React's recommended alternative to a reset effect.
  const [prevSource, setPrevSource] = useState({ domain, iconify });
  if (prevSource.domain !== domain || prevSource.iconify !== iconify) {
    setPrevSource({ domain, iconify });
    setError(false);
  }

  if (error) {
    return (
      <Globe
        className={cn("shrink-0 text-muted-foreground", className)}
        style={{ width: size, height: size }}
        aria-label={label}
      />
    );
  }
  return (
    <img
      src={faviconSrc({ domain, iconify, size })}
      alt={label ?? ""}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-sm", className)}
      onError={() => setError(true)}
    />
  );
}
