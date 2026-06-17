import { type ReactNode, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useConfigQuery } from "@renderer/lib/query-client"
import {
  getSettingsNavigationState,
  getVisibleSettingsNavGroups,
  type SettingsNavItem,
} from "@renderer/lib/settings-navigation"
import { cn } from "@renderer/lib/utils"

function SettingsIcon({
  icon,
  className,
}: {
  icon: string
  className?: string
}) {
  return <span className={cn(icon, "shrink-0", className)} />
}

export function SettingsSidebarNavigation({
  onBackToApp,
}: {
  onBackToApp?: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const configQuery = useConfigQuery()
  const activeState = getSettingsNavigationState(
    `${location.pathname}${location.hash}`,
  )
  const groups = getVisibleSettingsNavGroups({
    discordEnabled: configQuery.data?.discordEnabled ?? false,
    activeItemHref: activeState.itemHref,
  })
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return groups

    return groups
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(query)
        const items = groupMatches
          ? group.items
          : group.items.filter((item) =>
              item.label.toLowerCase().includes(query),
            )

        return {
          ...group,
          items,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [groups, searchQuery])

  const handleBackToApp = () => {
    if (onBackToApp) {
      onBackToApp()
      return
    }

    navigate("/")
  }

  const navigateToItem = (item: SettingsNavItem) => {
    navigate(item.href)
  }

  return (
    <nav
      className="flex h-full min-h-0 flex-col px-2 pb-3"
      aria-label="Settings"
    >
      <div className="shrink-0 px-1 pt-1">
        <button
          type="button"
          onClick={handleBackToApp}
          className="text-muted-foreground hover:bg-accent/50 hover:text-foreground flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors"
        >
          <span className="i-mingcute-left-line h-4 w-4 shrink-0" />
          <span className="truncate">Back to app</span>
        </button>

        <label className="relative mt-2 block">
          <span className="i-mingcute-search-2-line text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search settings..."
            className="border-input bg-background/70 placeholder:text-muted-foreground focus-visible:border-ring h-8 w-full rounded-md border px-8 text-sm outline-none transition-colors"
            aria-label="Search settings"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded"
              aria-label="Clear settings search"
            >
              <span className="i-mingcute-close-line h-3.5 w-3.5" />
            </button>
          )}
        </label>
      </div>

      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-1 py-3">
        {filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <section key={group.id} aria-label={group.label}>
                <div className="text-muted-foreground/80 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide">
                  {group.label}
                </div>
                <div className="grid gap-0.5">
                  {group.items.map((item) => {
                    const active = item.href === activeState.itemHref
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToItem(item)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-8 min-w-0 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                      >
                        <SettingsIcon icon={item.icon} className="h-4 w-4" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground px-2 py-4 text-sm">
            No settings found.
          </div>
        )}
      </div>
    </nav>
  )
}

export function SettingsNavigation() {
  return <SettingsSidebarNavigation />
}

export function SettingsPageShell({
  children,
  contentClassName,
  innerClassName,
}: {
  children: ReactNode
  contentClassName?: string
  innerClassName?: string
}) {
  return (
    <div className="modern-panel flex h-full min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6",
          contentClassName,
        )}
      >
        <div className={cn("mx-auto w-full max-w-5xl", innerClassName)}>
          {children}
        </div>
      </div>
    </div>
  )
}
