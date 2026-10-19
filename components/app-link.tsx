"use client";

import {
  createElement,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { LinkProps } from "next/link";
import type { UrlObject } from "node:url";

export type { LinkProps };

function resolveHref(href: string | UrlObject): string {
  if (typeof href === "string") return href;

  let path = href.pathname ?? "";
  const query = href.query;
  if (query !== undefined && query !== null) {
    if (typeof query === "string") {
      path += query.startsWith("?") ? query : `?${query}`;
    } else {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        if (Array.isArray(value)) {
          for (const item of value) params.append(key, String(item));
        } else {
          params.set(key, String(value));
        }
      }
      const serialized = params.toString();
      if (serialized) path += `?${serialized}`;
    }
  }

  if (href.hash) {
    path += href.hash.startsWith("#") ? href.hash : `#${href.hash}`;
  }

  return path;
}

type AppLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

/**
 * Navigasi full-page lewat `<a href>` — menghindari shim Vinext `next/link`
 * dan bug bundling production pada automatic JSX di modul ini.
 */
export default function Link({
  href,
  as,
  replace = false,
  children,
  onClick,
  onNavigate,
  prefetch: _prefetch,
  scroll: _scroll,
  passHref: _passHref,
  legacyBehavior: _legacyBehavior,
  locale: _locale,
  shallow: _shallow,
  unstable_dynamicOnHover: _unstableDynamicOnHover,
  transitionTypes: _transitionTypes,
  ...rest
}: AppLinkProps) {
  const url = resolveHref(as ?? href);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (onNavigate) {
      try {
        let prevented = false;
        onNavigate({
          preventDefault() {
            prevented = true;
          },
        });
        if (prevented) {
          event.preventDefault();
          return;
        }
      } catch {
        // relative / hash-only hrefs
      }
    }

    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = rest.target;
    if (target && target !== "_self") return;

    if (event.currentTarget.hasAttribute("download")) return;

    let absolute: URL;
    try {
      absolute = new URL(url, window.location.href);
    } catch {
      return;
    }

    if (absolute.protocol !== "http:" && absolute.protocol !== "https:") {
      event.preventDefault();
      return;
    }

    if (absolute.origin !== window.location.origin) {
      return;
    }

    if (replace) {
      event.preventDefault();
      window.location.replace(absolute.pathname + absolute.search + absolute.hash);
    }
  };

  return createElement(
    "a",
    { href: url, onClick: handleClick, ...rest },
    children as ReactNode,
  );
}
