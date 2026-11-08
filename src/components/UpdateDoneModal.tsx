import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { lockModalLayer, trapModalFocus, unlockModalLayer } from '../lib/modalLayer';

type Props = {
  open: boolean;
  version: string;
  onClose: () => void;
  t: (k: string) => string;
  returnFocusRef: React.RefObject<HTMLElement>;
};

/** Confirmation shown after a successful update check finds no newer version (US-1). */
export default function UpdateDoneModal({ open, version, onClose, t, returnFocusRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lockModalLayer();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      trapModalFocus(e, dialogRef.current);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockModalLayer();
      returnFocusRef.current?.focus();
    };
  }, [open, returnFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t('settings.updateModalTitle')} className="surface modal">
        <div className="modal-head">
          <div>
            <h3>{t('settings.updateModalTitle')}</h3>
            <p className="hero-meta">{t('settings.updateModalBody').replace('{version}', version)}</p>
          </div>
        </div>
        <div className="modal-foot form-actions">
          <button ref={closeRef} type="button" className="cta cta-compact" data-testid="update-modal-close" onClick={onClose}>
            {t('settings.updateClose')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
