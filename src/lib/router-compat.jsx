// Compatibility layer so pages ported from the original SPA keep working
// on TanStack Router (the router used by this stack).
import React from "react";
import {
  Link as TanStackLink,
  Outlet as TanStackOutlet,
  useRouterState,
} from "@tanstack/react-router";

export const Outlet = TanStackOutlet;

export const Link = React.forwardRef(function Link({ to, children, ...props }, ref) {
  const href = typeof to === "string" ? to : "/";
  // Plain anchors keep external/hash links working identically to the SPA.
  if (/^(https?:|mailto:|tel:|#)/.test(href)) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <TanStackLink ref={ref} to={href} {...props}>
      {children}
    </TanStackLink>
  );
});

export function useLocation() {
  const location = useRouterState({ select: (s) => s.location });
  return {
    pathname: location.pathname,
    search: location.searchStr ? `?${location.searchStr.replace(/^\?/, "")}` : "",
    hash: location.hash ? `#${location.hash.replace(/^#/, "")}` : "",
    state: location.state,
    key: location.href,
  };
}

export function useNavigationType() {
  return "PUSH";
}

export function useSearchParams() {
  const location = useLocation();
  const params = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const setSearchParams = React.useCallback((next) => {
    const value = typeof next === "function" ? next(new URLSearchParams(window.location.search)) : next;
    const qs = new URLSearchParams(value).toString();
    window.history.pushState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, []);
  return [params, setSearchParams];
}
