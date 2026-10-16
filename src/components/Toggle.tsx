type ToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  onText?: string;
  offText?: string;
};

export default function Toggle({ checked, onChange, label, disabled = false, onText = 'On', offText = 'Off' }: ToggleProps) {
  return (
    <span className="switch-field">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        data-on={checked ? 'true' : 'false'}
        className="toggle"
        onClick={() => onChange(!checked)}
      >
        <span className="knob" aria-hidden="true" />
      </button>
      <span className="switch-state" aria-hidden="true">
        {checked ? onText : offText}
      </span>
    </span>
  );
}
