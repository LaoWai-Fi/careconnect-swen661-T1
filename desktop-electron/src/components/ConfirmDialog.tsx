import { useId } from "react"
import type { ReactNode } from "react"
import TapButton from "./TapButton"
import { useFocusTrap } from "../useFocusTrap"

interface Props {
  title: string
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Accessible confirmation dialog: role="alertdialog", labelled by its title,
 * keyboard focus trapped inside, Escape cancels, focus returns to the trigger.
 */
export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useFocusTrap(true, onCancel)
  const titleId = useId()
  const bodyId = useId()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative bg-[var(--card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4"
      >
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <p id={bodyId} className="text-[var(--muted-foreground)] text-sm">
          {body}
        </p>
        <div className="flex gap-3">
          <TapButton variant="outline" size="lg" onClick={onCancel} className="flex-1">
            Cancel
          </TapButton>
          <TapButton variant="destructive" size="lg" onClick={onConfirm} className="flex-1">
            {confirmLabel}
          </TapButton>
        </div>
      </div>
    </div>
  )
}
