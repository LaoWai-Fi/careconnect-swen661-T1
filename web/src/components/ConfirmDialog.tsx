import type { RefObject } from 'react';
import Modal from './Modal';

export interface ConfirmDialogProps {
  open: boolean; title: string; description?: string;
  confirmLabel?: string; cancelLabel?: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onConfirm: () => void; onCancel: () => void;
}

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onCancel}>
      <div className="web-dialog-actions">
        <button type="button" className="btn-secondary" data-autofocus onClick={onCancel}>{cancelLabel}</button>
        <button type="button" className="btn-primary web-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
