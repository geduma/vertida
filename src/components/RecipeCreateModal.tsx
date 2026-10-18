import { useEffect, useRef, useState } from 'react';

type MethodOpt = { id: string; nameKey: string; limits?: { cupsMax: number; waterMaxG: number; coffeeMaxG?: number; ratioMin?: number; ratioMax?: number } };

type Props = {
  open: boolean;
  methods: MethodOpt[];
  onClose: () => void;
  onSave: (input: { name: string; methodId: string; ratio: number; coffeeDefaultG: number; notes?: string }) => string | null;
  t: (k: string) => string;
  returnFocusRef: React.RefObject<HTMLElement>;
};

export default function RecipeCreateModal({ open, methods, onClose, onSave, t, returnFocusRef }: Props) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [methodId, setMethodId] = useState(methods[0]?.id ?? '');
  const [ratio, setRatio] = useState<number | ''>(16);
  const [coffee, setCoffee] = useState<number | ''>(15);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const lim = methods.find(m => m.id === methodId)?.limits;
  const coffeeMax = lim?.coffeeMaxG ?? 500;
  const ratioMin = lim?.ratioMin ?? 1;
  const ratioMax = lim?.ratioMax ?? 50;
  const ratioFixed = ratioMin === ratioMax;

  useEffect(() => {
    if (!open) return;
    setErr(null);
    nameRef.current?.focus();
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

  useEffect(() => {
    if (open && methods.length) setMethodId((m) => m || methods[0].id);
  }, [open, methods]);

  if (!open) return null;

  const submit = () => {
    if (!name.trim()) {
      setErr(t('error.required'));
      return;
    }
    if (ratio === '' || !(ratio >= ratioMin && ratio <= ratioMax)) {
      setErr(t('error.ratio-range'));
      return;
    }
    if (coffee === '' || !(coffee >= 1 && coffee <= coffeeMax)) {
      setErr(t('error.coffee-range'));
      return;
    }
    const res = onSave({ name: name.trim().slice(0, 60), methodId, ratio: Number(ratio), coffeeDefaultG: Number(coffee), notes });
    if (res) {
      setErr(res);
      return;
    }
    setName('');
    setNotes('');
    setRatio(16);
    setCoffee(15);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={t('recipes.create')} className="surface modal">
        <div className="modal-head">
          <div>
            <h3>{t('recipes.create')}</h3>
            <p className="hero-meta">{t('recipes.createHint')}</p>
          </div>
        </div>
        <div className="form-grid">
          <label>{t('recipes.fieldName')}
            <input ref={nameRef} type="text" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={t('recipes.fieldNamePh')} />
          </label>
          <label>{t('brew.method')}
            <select value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{t(m.nameKey)}</option>
              ))}
            </select>
          </label>
          <div className="dosis-grid">
            <label>{t('calc.ratio')}
              <input type="number" value={ratio} min={ratioMin} max={ratioMax} step={0.5} disabled={ratioFixed} onChange={(e) => setRatio(e.target.value === '' ? '' : +e.target.value)} onBlur={() => setRatio(r => (r === '' || !Number.isFinite(r) ? 16 : Math.min(ratioMax, Math.max(ratioMin, r))))} />
            </label>
            <label>{t('calc.coffee')}
              <input type="number" value={coffee} min={1} max={coffeeMax} step={0.5} onChange={(e) => setCoffee(e.target.value === '' ? '' : +e.target.value)} onBlur={() => setCoffee(c => (c === '' || !Number.isFinite(c) ? 15 : Math.min(coffeeMax, Math.max(1, c))))} />
            </label>
          </div>
          {lim && <p className="next" data-testid="create-limit-hint">{t('method.limitHint').replace('{cups}', String(lim.cupsMax)).replace('{water}', String(lim.waterMaxG)).replace('{method}', t(methods.find(m => m.id === methodId)?.nameKey ?? methodId))}</p>}
          <label>{t('recipes.fieldNotes')}
            <input type="text" value={notes} maxLength={140} onChange={(e) => setNotes(e.target.value)} placeholder={t('recipes.fieldNotesPh')} />
          </label>
        </div>
        {err && <p role="alert"><b>{err}</b></p>}
        <div className="modal-foot form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('recipes.cancel')}</button>
          <button type="button" className="cta cta-compact" onClick={submit}>{t('recipes.save')}</button>
        </div>
      </div>
    </div>
  );
}
