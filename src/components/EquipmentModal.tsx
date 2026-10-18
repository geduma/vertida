import { useEffect, useRef } from 'react';
import EquipmentIcon from './EquipmentIcon';

export type EquipMethod = {
  id: string;
  nameKey: string;
  descriptionKey?: string;
  descripcion?: string;
  icon: string;
};

type Props = {
  open: boolean;
  methods: EquipMethod[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  t: (k: string) => string;
  returnFocusRef: React.RefObject<HTMLElement>;
};

export default function EquipmentModal({ open, methods, selected, onToggle, onClose, t, returnFocusRef }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    saveRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnFocusRef.current?.focus();
    };
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={t('settings.equipmentChoose')} className="surface modal">
        <div className="modal-head">
          <div>
            <h3>{t('settings.equipment')}</h3>
            <p className="hero-meta">{t('settings.equipmentHint')}</p>
          </div>
        </div>
        <div className="equip-grid">
          {methods.map((m) => {
            const active = selected.includes(m.id);
            return (
              <label key={m.id} className="equip-card" data-on={active ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  onChange={() => onToggle(m.id)}
                  aria-label={t(m.nameKey)}
                />
                <span className="equip-icon" aria-hidden="true">
                  <EquipmentIcon id={m.icon} />
                </span>
                <span className="equip-name">{t(m.nameKey)}</span>
                {(m.descriptionKey || m.descripcion) && (
                  <span className="hero-meta">{m.descriptionKey ? t(m.descriptionKey) : m.descripcion}</span>
                )}
                <span className="equip-check" aria-hidden="true">
                  {active ? '●' : '○'}
                </span>
              </label>
            );
          })}
        </div>
        <div className="modal-foot form-actions">
          <span className="hero-meta modal-count">
            {selected.length} / {methods.length}
          </span>
          <button ref={saveRef} type="button" className="cta cta-compact" onClick={onClose}>
            {t('settings.equipmentSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
