import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@renderer/components/ui/dialog"
import { RemoteServerSettingsGroups } from "@renderer/pages/settings-remote-server"

type ConnectionPairingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectionPairingDialog({ open, onOpenChange }: ConnectionPairingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Pair DotAgents Mobile or another client from the main app window without leaving chat home.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <RemoteServerSettingsGroups />
        </div>
      </DialogContent>
    </Dialog>
  )
}