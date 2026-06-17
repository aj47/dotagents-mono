import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import { useConfigQuery } from "@renderer/lib/query-client"
import {
  getAgentShortcutDisplay,
  getDictationShortcutDisplay,
  getMainWindowNewChatShortcutDisplay,
  getSettingsHotkeyDisplay,
  getTextInputShortcutDisplay,
  getToggleVoiceDictationShortcutDisplay,
  getVoiceScreenshotShortcutDisplay,
} from "@shared/key-utils"

const IS_MAC =
  typeof navigator !== "undefined" &&
  navigator.platform.toLowerCase().includes("mac")

type ShortcutRow = {
  label: string
  shortcut: string
  detail?: string
}

type ShortcutGroup = {
  title: string
  rows: ShortcutRow[]
}

function ShortcutKey({ value }: { value: string }) {
  return (
    <kbd className="inline-flex min-h-5 max-w-full items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none text-foreground">
      {value}
    </kbd>
  )
}

function ShortcutGroupList({ group }: { group: ShortcutGroup }) {
  return (
    <section className="min-w-0">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {group.title}
      </h3>
      <div className="overflow-hidden rounded-md border">
        {group.rows.map((row) => (
          <div
            key={`${group.title}-${row.label}`}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {row.label}
              </div>
              {row.detail && (
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {row.detail}
                </div>
              )}
            </div>
            <ShortcutKey value={row.shortcut} />
          </div>
        ))}
      </div>
    </section>
  )
}

interface ShortcutReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShortcutReferenceDialog({
  open,
  onOpenChange,
}: ShortcutReferenceDialogProps) {
  const configQuery = useConfigQuery()
  const config = configQuery.data
  const platformModifier = IS_MAC ? "Cmd" : "Ctrl"

  const globalInputRows: ShortcutRow[] = [
    {
      label: "Text input",
      shortcut:
        config?.textInputEnabled === false
          ? "Off"
          : getTextInputShortcutDisplay(
              config?.textInputShortcut,
              config?.customTextInputShortcut,
            ),
    },
    {
      label: "Dictation",
      shortcut: getDictationShortcutDisplay(
        config?.shortcut,
        config?.customShortcut,
      ),
    },
    {
      label: "Agent mode",
      shortcut: getAgentShortcutDisplay(
        config?.agentShortcut || config?.mcpToolsShortcut,
        config?.customAgentShortcut || config?.customMcpToolsShortcut,
      ),
    },
    {
      label: "Show main window",
      shortcut:
        config?.settingsHotkeyEnabled === false
          ? "Off"
          : getSettingsHotkeyDisplay(
              config?.settingsHotkey,
              config?.customSettingsHotkey,
            ),
    },
    {
      label: "Emergency stop",
      shortcut: "Ctrl+Shift+Escape",
    },
  ]

  if (config?.toggleVoiceDictationEnabled) {
    globalInputRows.push({
      label: "Toggle dictation",
      shortcut: getToggleVoiceDictationShortcutDisplay(
        config.toggleVoiceDictationHotkey,
        config.customToggleVoiceDictationHotkey,
      ),
    })
  }

  if (IS_MAC && config?.voiceScreenshotShortcutEnabled !== false) {
    globalInputRows.push({
      label: "Voice screenshot",
      shortcut: getVoiceScreenshotShortcutDisplay(
        config?.voiceScreenshotShortcut,
        config?.customVoiceScreenshotShortcut,
      ),
    })
  }

  const groups: ShortcutGroup[] = [
    {
      title: "Main Window",
      rows: [
        {
          label: "New chat",
          shortcut: getMainWindowNewChatShortcutDisplay(IS_MAC),
        },
        {
          label: "Saved conversations",
          shortcut: `${platformModifier}+K`,
        },
        {
          label: "Archive focused session",
          shortcut: "Ctrl+W",
        },
        {
          label: "Open sidebar item",
          shortcut: `${platformModifier}+1-9`,
        },
      ],
    },
    {
      title: "Global Input",
      rows: globalInputRows,
    },
    {
      title: "Composer",
      rows: [
        {
          label: "Send message",
          shortcut: "Enter",
        },
        {
          label: "New line",
          shortcut: "Shift+Enter",
        },
        {
          label: "Close composer",
          shortcut: "Esc",
        },
        {
          label: "Finish voice recording",
          shortcut: "Enter",
        },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Shortcut reference for the desktop app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {groups.map((group) => (
            <ShortcutGroupList key={group.title} group={group} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
