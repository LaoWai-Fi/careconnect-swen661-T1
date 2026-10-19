import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/** Native modal dialogs make the rest of the document inert and contain Tab focus. */
export default function Modal({ id, open, title, description, onClose, children, className = '' }: {
  id?: string; open: boolean; title: string; description?: string;
  onClose: () => void; children: ReactNode; className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      const fallback = document.querySelector<HTMLElement>('main h1') || document.querySelector<HTMLElement>('main');
      const canRestore = opener?.isConnected && opener.getClientRects().length > 0;
      const target = canRestore ? opener : fallback;
      if (target) { if (!canRestore) target.tabIndex = -1; target.focus(); }
    };
  }, [open]);
  return (
    <dialog id={id} ref={dialogRef} aria-labelledby={titleId} aria-modal="true"
      aria-describedby={description ? descriptionId : undefined}
      className={`web-modal ${className}`}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        )).filter((control) => control.getClientRects().length > 0);
        const target = event.shiftKey ? controls[controls.length - 1] : controls[0];
        const boundary = event.shiftKey ? controls[0] : controls[controls.length - 1];
        if (target && document.activeElement === boundary) { event.preventDefault(); target.focus(); }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (event.target === event.currentTarget &&
          (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) onClose();
      }}>
      <div className="web-modal-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="web-icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={22} aria-hidden="true" />
        </button>
      </div>
      {description && <p id={descriptionId} className="web-modal-description">{description}</p>}
      {children}
    </dialog>
  );
}
