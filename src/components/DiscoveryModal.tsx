import { useEffect, useRef } from 'react';
import EquipmentIcon from './EquipmentIcon';
import type { Recipe } from '../lib/schemas';

type Props = {
  recipe: Recipe | null;
  methodName: string;
  methodIcon: string;
  onClose: () => void;
  onBrew: () => void;
  onReroll: () => void;
  t: (k: string) => string;
};

export default function DiscoveryModal({ recipe, methodName, methodIcon, onClose, onBrew, onReroll, t }: Props) {
  const brewRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!recipe) return;
    brewRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [recipe]);

  if (!recipe) return null;
  const secs = recipe.fases.reduce((a, f) => a + f.duracionS, 0);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={t('discover.title')} className="surface modal">
        <div className="modal-head">
          <div>
            <h3>{t('discover.title')}</h3>
            <p className="hero-meta">{methodName}</p>
          </div>
          <span className="equip-icon" aria-hidden="true">
            <EquipmentIcon id={methodIcon} />
          </span>
        </div>
        <div className="stack">
          <h3>{t(recipe.nombreKey)}</h3>
          <p className="hero-meta">1:{recipe.ratio} · {recipe.cafeDefaultG}g · {recipe.fases.length} fases · ~{Math.max(1, Math.round(secs / 60))} min</p>
          {recipe.historiaKey && <p className="next">{t(recipe.historiaKey)}</p>}
        </div>
        <div className="modal-foot form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('discover.close')}</button>
          <button type="button" className="btn-secondary" onClick={onReroll}>{t('discover.another')}</button>
          <button ref={brewRef} type="button" className="cta cta-compact" onClick={onBrew}>{t('home.prepare')}</button>
        </div>
      </div>
    </div>
  );
}
