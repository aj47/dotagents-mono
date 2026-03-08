import type { LoaderFunctionArgs } from "react-router-dom"
import { createBrowserRouter, redirect } from "react-router-dom"
import { getLegacySettingsRedirectPath } from "./lib/legacy-settings-redirect"

const legacySettingsRedirect =
  (targetPath: string) =>
  ({ request }: LoaderFunctionArgs) =>
    redirect(getLegacySettingsRedirectPath(targetPath, request.url))

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      path: "/",
      lazy: () => import("./components/app-layout"),
      children: [
        {
          path: "",
          lazy: () => import("./pages/sessions"),
        },
        {
          path: ":id",
          lazy: () => import("./pages/sessions"),
        },
        {
          path: "history",
          lazy: () => import("./pages/sessions"),
        },
        {
          path: "history/:id",
          lazy: () => import("./pages/sessions"),
        },
        {
          path: "settings",
          lazy: () => import("./pages/settings-general"),
        },
        {
          path: "settings/general",
          lazy: () => import("./pages/settings-general"),
        },
        {
          path: "settings/providers",
          lazy: () => import("./pages/settings-providers-and-models"),
        },
        {
          path: "settings/models",
          lazy: () => import("./pages/settings-providers-and-models"),
        },

        {
          path: "settings/capabilities",
          lazy: () => import("./pages/settings-capabilities"),
        },
        {
          path: "settings/mcp-tools",
          loader: legacySettingsRedirect("/settings/capabilities?tab=mcp-servers"),
        },
        {
          path: "settings/skills",
          loader: legacySettingsRedirect("/settings/capabilities?tab=skills"),
        },
        {
          path: "settings/remote-server",
          loader: legacySettingsRedirect("/settings"),
        },
        {
          path: "settings/whatsapp",
          lazy: () => import("./pages/settings-whatsapp"),
        },
        {
          path: "settings/agents",
          lazy: () => import("./pages/settings-agents"),
        },
        {
          path: "settings/repeat-tasks",
          lazy: () => import("./pages/settings-loops"),
        },
        {
          path: "settings/loops",
          loader: legacySettingsRedirect("/settings/repeat-tasks"),
        },
        {
          path: "settings/agent-personas",
          loader: legacySettingsRedirect("/settings/agents"),
        },
        {
          path: "settings/external-agents",
          loader: legacySettingsRedirect("/settings/agents"),
        },
        {
          path: "settings/agent-profiles",
          loader: legacySettingsRedirect("/settings/agents"),
        },
        {
          path: "settings/langfuse",
          loader: legacySettingsRedirect("/settings"),
        },
        {
          path: "memories",
          lazy: () => import("./pages/memories"),
        },
      ],
    },
    {
      path: "/setup",
      lazy: () => import("./pages/setup"),
    },
    {
      path: "/onboarding",
      lazy: () => import("./pages/onboarding"),
    },
    {
      path: "/panel",
      lazy: () => import("./pages/panel"),
    },
  ], {
    future: {
	      // React Router future flags are version-dependent. Keep this enabled when
	      // supported, but don't fail typechecking on versions that don't include it.
	      v7_startTransition: true,
	    } as any,
  })
