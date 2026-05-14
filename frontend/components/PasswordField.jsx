import { useId, useState } from 'react';

export default function PasswordField({ label, placeholder, value, onChange, error }) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <label>
      <span>{label}</span>
      <span className="password-field">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <span className={`eye-icon ${visible ? 'open' : 'closed'}`} aria-hidden="true"></span>
        </button>
      </span>
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
