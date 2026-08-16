import { createHashHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { MobileAuthReact } from "./mobile-auth-react";

const rootRoute = createRootRoute({
  component: () => <MobileAuthReact />,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: MobileAuthReact,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MobileAuthReact,
});

const routeTree = rootRoute.addChildren([authRoute, indexRoute]);

export function getMobileAuthRouter() {
  return createRouter({
    routeTree,
    history: createHashHistory(),
    scrollRestoration: false,
    defaultPreload: false,
    defaultPreloadStaleTime: Infinity,
  });
}
