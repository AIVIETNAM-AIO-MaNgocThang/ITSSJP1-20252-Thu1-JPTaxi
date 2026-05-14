import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import Topbar from '../components/Topbar.jsx';
import { emailPattern } from '../utils/loginValidation.js';
import '../styles/auth.css';

const loginMessages = {
  emailRequired: 'メールアドレスを入力してください。',
  emailInvalid: '正しいメールアドレス形式で入力してください。',
  passwordRequired: 'パスワードを入力してください。',
  passwordShort: 'パスワードは6文字以上で入力してください。',
  success: 'ログイン情報を確認しました。',
};

export default function LoginPage() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');

  function setFieldError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }));
  }

  function validateEmail(nextEmail = email) {
    const trimmedEmail = nextEmail.trim();

    if (!trimmedEmail) {
      setFieldError('email', loginMessages.emailRequired);
      return false;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setFieldError('email', loginMessages.emailInvalid);
      return false;
    }

    setFieldError('email', '');
    return true;
  }

  function validatePassword(nextPassword = password) {
    if (!nextPassword) {
      setFieldError('password', loginMessages.passwordRequired);
      return false;
    }

    if (nextPassword.length < 6) {
      setFieldError('password', loginMessages.passwordShort);
      return false;
    }

    setFieldError('password', '');
    return true;
  }

  function handleEmailChange(event) {
    const nextEmail = event.target.value;
    setEmail(nextEmail);
    setStatus('');

    if (nextEmail.trim()) {
      validateEmail(nextEmail);
    } else {
      setFieldError('email', '');
    }
  }

  function handlePasswordChange(event) {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    setStatus('');

    if (nextPassword) {
      validatePassword(nextPassword);
    } else {
      setFieldError('password', '');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setStatus('');

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      if (!isEmailValid) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    if (remember) {
      localStorage.setItem('jpTaxiLoginEmail', email.trim());
    } else {
      localStorage.removeItem('jpTaxiLoginEmail');
    }

    setStatus(loginMessages.success);
  }

  function openForgotModal() {
    setForgotEmail(email.trim());
    setForgotError('');
    setForgotStatus('');
    setForgotOpen(true);
  }

  function handleForgotSubmit(event) {
    event.preventDefault();
    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotError(loginMessages.emailRequired);
      setForgotStatus('');
      return;
    }

    if (!emailPattern.test(trimmedEmail)) {
      setForgotError(loginMessages.emailInvalid);
      setForgotStatus('');
      return;
    }

    setForgotError('');
    setForgotStatus('再設定手順を送信しました。');
  }

  return (
    <PageShell withFooter={false}>
      <main className="auth-screen">
        <Topbar />

        <section className="auth-layout">
          <div className="intro">
            <span className="eyebrow">🚕 日本語対応タクシーサービス</span>
            <h1>安心・簡単にJP TAXIへログイン</h1>
            <p>日本語でタクシーを予約し、移動履歴、メッセージ、アカウント情報をまとめて管理できます。</p>

            <div className="benefits" aria-label="サービスの特徴">
              <article>
                <h2>日本語対応</h2>
                <p>日本人利用者にも分かりやすいUIで安心して利用できます。</p>
              </article>
              <article>
                <h2>簡単予約</h2>
                <p>目的地の検索から配車確認まで、スムーズに進められます。</p>
              </article>
              <article>
                <h2>安全な連絡</h2>
                <p>アプリ内メッセージ機能でドライバーと直接連絡できます。</p>
              </article>
            </div>
          </div>

          <section className="auth-card" aria-labelledby="login-title">
            <div className="form-logo" aria-hidden="true">🚕</div>
            <div className="form-heading">
              <h2 id="login-title">ログイン</h2>
              <p>メールアドレスとパスワードを入力して、システムにアクセスしてください。</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label>
                <span>メールアドレス</span>
                <input
                  ref={emailRef}
                  id="emailInput"
                  className={errors.email ? 'input-error' : ''}
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  aria-invalid={String(Boolean(errors.email))}
                  aria-describedby="emailError"
                />
                <span className="field-error" id="emailError" aria-live="polite">
                  {errors.email}
                </span>
              </label>

              <PasswordField
                label="パスワード"
                placeholder="パスワードを入力"
                value={password}
                onChange={handlePasswordChange}
                error={errors.password}
                errorId="passwordError"
                inputRef={passwordRef}
              />

              <div className="form-row">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>ログイン状態を保持する</span>
                </label>
                <button className="forgot-button" type="button" onClick={openForgotModal}>
                  パスワードを忘れた場合
                </button>
              </div>

              <div className={`form-status ${status ? 'show' : ''}`} role="status" aria-live="polite">
                {status}
              </div>

              <button className="submit-button" type="submit">ログインする</button>
              <div className="login-register-links">
                <p className="note-link">アカウントをお持ちでないですか？ <Link to="/register">顧客登録</Link></p>
                <Link className="driver-register-link" to="/driver-register">運転者登録</Link>
              </div>
            </form>
          </section>
        </section>

        <Modal open={forgotOpen} title="パスワード再設定" onClose={() => setForgotOpen(false)}>
          <p className="modal-copy">登録済みのメールアドレスを入力してください。該当するアカウントがある場合、再設定手順を送信します。</p>
          <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
            <label>
              <span>メールアドレス</span>
              <input
                type="email"
                className={forgotError ? 'input-error' : ''}
                placeholder="example@email.com"
                autoComplete="email"
                value={forgotEmail}
                onChange={(event) => {
                  setForgotEmail(event.target.value);
                  setForgotError('');
                  setForgotStatus('');
                }}
                aria-invalid={String(Boolean(forgotError))}
              />
              <span className="field-error" aria-live="polite">{forgotError}</span>
            </label>
            <div className={`form-status ${forgotStatus ? 'show' : ''}`} role="status" aria-live="polite">
              {forgotStatus}
            </div>
            <button className="submit-button" type="submit">送信する</button>
          </form>
        </Modal>
      </main>
    </PageShell>
  );
}
