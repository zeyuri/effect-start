import { RegistryProvider } from "@effect/atom-react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <RegistryProvider defaultIdleTTL={60_000}>
      <RouterProvider router={router} />
    </RegistryProvider>
  </StrictMode>
);
