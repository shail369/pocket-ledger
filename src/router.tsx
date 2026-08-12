import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();
  const mobileHistory = import.meta.env.VITE_MOBILE === "true" ? createHashHistory() : undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: mobileHistory,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
