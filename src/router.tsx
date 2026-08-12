import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const isMobile = import.meta.env.VITE_MOBILE === "true";
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: isMobile ? 60_000 : 30_000,
        gcTime: isMobile ? 5 * 60_000 : 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: isMobile ? createHashHistory() : undefined,
    scrollRestoration: false,
    defaultPreloadStaleTime: isMobile ? 60_000 : 0,
  });

  return router;
};
