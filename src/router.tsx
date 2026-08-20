import { lazy, Suspense, createContext, useContext, useEffect, useMemo, useState, type ComponentType, type MouseEvent, type ReactNode } from "react";

type RouteOptions = {
  component: ComponentType<any>;
  head?: unknown;
  shellComponent?: ComponentType<any>;
  notFoundComponent?: ComponentType<any>;
  errorComponent?: ComponentType<any>;
};

type NavigateTarget = string | { to: string; params?: Record<string, string | number> };
type RouterContextValue = { pathname: string; navigate: (target: NavigateTarget) => void };

const RouterContext = createContext<RouterContextValue | null>(null);

function currentPathname() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash.split("?")[0] || "/";
}

function resolveTarget(target: NavigateTarget) {
  if (typeof target === "string") return target;
  let path = target.to;
  for (const [key, value] of Object.entries(target.params ?? {})) {
    path = path.replace(`$${key}`, encodeURIComponent(String(value)));
  }
  return path;
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useNavigate must be used inside RouterProvider");
  return (target: NavigateTarget) => context.navigate(target);
}

export function useRouterState<T>({ select }: { select: (state: { location: { pathname: string } }) => T }) {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouterState must be used inside RouterProvider");
  return select({ location: { pathname: context.pathname } });
}

export function Link({ to, params, onClick, children, ...props }: any) {
  const navigate = useNavigate();
  const href = `#${resolveTarget({ to, params })}`;

  return (
    <a
      {...props}
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate({ to, params });
      }}
    >
      {children}
    </a>
  );
}

export function createFileRoute(_path: string) {
  return (options: RouteOptions) => ({
    ...options,
    useParams: () => {
      const { pathname } = useContext(RouterContext) ?? { pathname: "/" };
      const match = pathname.match(/^\/accounts\/([^/]+)\/?$/);
      return { accountId: match?.[1] ? decodeURIComponent(match[1]) : "" };
    },
    useSearch: () => {
      const query = window.location.hash.split("?")[1] ?? "";
      return Object.fromEntries(new URLSearchParams(query));
    },
  });
}

const Dashboard = lazy(() => import("./routes/_shell.index").then((m) => ({ default: m.Route.component })));
const Insights = lazy(() => import("./routes/_shell.insights").then((m) => ({ default: m.Route.component })));
const Transactions = lazy(() => import("./routes/_shell.transactions").then((m) => ({ default: m.Route.component })));
const Accounts = lazy(() => import("./routes/_shell.accounts.index").then((m) => ({ default: m.Route.component })));
const AccountDetail = lazy(() => import("./routes/_shell.accounts.$accountId").then((m) => ({ default: m.Route.component })));
const More = lazy(() => import("./routes/_shell.more.index").then((m) => ({ default: m.Route.component })));
const Budgets = lazy(() => import("./routes/_shell.more.budgets").then((m) => ({ default: m.Route.component })));
const Categories = lazy(() => import("./routes/_shell.more.categories").then((m) => ({ default: m.Route.component })));
const Recurring = lazy(() => import("./routes/_shell.more.recurring").then((m) => ({ default: m.Route.component })));
const Reports = lazy(() => import("./routes/_shell.more.reports").then((m) => ({ default: m.Route.component })));
const Settings = lazy(() => import("./routes/_shell.more.settings").then((m) => ({ default: m.Route.component })));

function componentForPath(pathname: string) {
  if (pathname === "/" || pathname === "") return Dashboard;
  if (pathname === "/insights") return Insights;
  if (pathname === "/transactions") return Transactions;
  if (pathname === "/accounts" || pathname === "/accounts/") return Accounts;
  if (/^\/accounts\/[^/]+\/?$/.test(pathname)) return AccountDetail;
  if (pathname === "/more" || pathname === "/more/") return More;
  if (pathname === "/more/budgets") return Budgets;
  if (pathname === "/more/categories") return Categories;
  if (pathname === "/more/recurring") return Recurring;
  if (pathname === "/more/reports") return Reports;
  if (pathname === "/more/settings") return Settings;
  return Dashboard;
}

export function Outlet() {
  const context = useContext(RouterContext);
  const pathname = context?.pathname ?? "/";
  const Component = useMemo(() => componentForPath(pathname), [pathname]);

  return (
    <Suspense fallback={<div className="grid min-h-[50vh] place-items-center"><div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <Component />
    </Suspense>
  );
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState(currentPathname);

  useEffect(() => {
    const update = () => setPathname(currentPathname());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);

  const value = useMemo<RouterContextValue>(() => ({
    pathname,
    navigate: (target) => {
      const next = resolveTarget(target) || "/";
      if (next !== pathname) window.location.hash = `#${next}`;
    },
  }), [pathname]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}
