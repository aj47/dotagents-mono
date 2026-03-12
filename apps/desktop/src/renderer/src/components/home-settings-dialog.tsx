import { Button } from "@renderer/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { useConfigQuery } from "@renderer/lib/query-client"
import { Brain, BookOpen, Cog, MessageSquare, Plug2, QrCode, RefreshCw, Sparkles, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

type HomeSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HomeSettingsDialog({ open, onOpenChange }: HomeSettingsDialogProps) {
  const navigate = useNavigate()
  const configQuery = useConfigQuery()

  const settingsLinks = [
    { label: "General", href: "/settings", icon: Cog },
    { label: "Connection", href: "/settings/remote-server", icon: QrCode },
    { label: "Models", href: "/settings/models", icon: Brain },
    { label: "Providers", href: "/settings/providers", icon: Plug2 },
    { label: "Capabilities", href: "/settings/capabilities", icon: Sparkles },
    { label: "Agents", href: "/settings/agents", icon: Users },
    { label: "Repeat Tasks", href: "/settings/repeat-tasks", icon: RefreshCw },
    { label: "Memories", href: "/memories", icon: BookOpen },
    ...(configQuery.data?.whatsappEnabled
      ? [{ label: "WhatsApp", href: "/settings/whatsapp", icon: MessageSquare }]
      : []),
  ] as const

  const handleNavigate = (href: string) => {
    onOpenChange(false)
    navigate(href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Keep the main screen focused on chats and pairing, then jump into deeper settings only when you need them.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {settingsLinks.map(({ label, href, icon: Icon }) => (
            <Button
              key={href}
              type="button"
              variant="outline"
              className="h-auto justify-start gap-2 px-3 py-3 text-left"
              onClick={() => handleNavigate(href)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}