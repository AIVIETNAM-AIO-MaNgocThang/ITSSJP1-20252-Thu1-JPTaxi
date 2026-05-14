import { Link } from 'react-router-dom';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/auth.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'メールアドレスを入力してください。';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = '正しいメールアドレス形式で入力してください。';
    }

    if (!password) {
      nextErrors.password = 'パスワードを入力してください。';
    } else if (password.length < 6) {
      nextErrors.password = 'パスワードは6文字以上で入力してください。';
    }

    setErrors(nextErrors);
    setStatus('');

    if (Object.keys(nextErrors).length === 0) {
      setStatus('ログイン情報を確認しました。');
    }
  }

  function openForgotModal() {
    setForgotEmail(email);
    setForgotOpen(true);
  }

  return (
    <PageShell withFooter={false}>
      <main className="auth-screen">
        <Topbar />

        <section className="auth-layout">
          <div className="intro">
            <span className="eyebrow">🚕 日本語対応タクシーサービス</span>
            <h1>安心してJP TAXIにログイン</h1>
            <p>日本語でタクシーを予約し、移動履歴、メッセージ、アカウント情報をまとめて管理できます。</p>

            <div className="benefits" aria-label="サービスの特徴">
              <article>
                <h2>簡単予約</h2>
                <p>目的地の検索から配車確認まで、ひとつの画面フローで進められます。</p>
              </article>
              <article>
                <h2>安全な連絡</h2>
                <p>アプリ内の情報でドライバーとの連絡や乗車内容を確認できます。</p>
              </article>
            </div>
          </div>

          <section className="auth-card" aria-labelledby="login-title">
            <div className="form-logo" aria-hidden="true">🚕</div>
            <div className="form-heading">
              <h2 id="login-title">ログイン</h2>
              <p>メールアドレスとパスワードを入力してください。</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <label>
                <span>メールアドレス</span>
                <input
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </label>

              <PasswordField
                label="パスワード"
                placeholder="パスワードを入力"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={errors.password}
              />

              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" />
                  <span>ログイン状態を保持</span>
                </label>
                <button className="forgot-button" type="button" onClick={openForgotModal}>
                  パスワードを忘れた場合
                </button>
              </div>

              {status && <div className="form-status">{status}</div>}

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
          <form className="auth-form" onSubmit={(event) => event.preventDefault()} noValidate>
            <label>
              <span>メールアドレス</span>
              <input
                type="email"
                placeholder="example@email.com"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
              />
            </label>
            <button className="submit-button" type="submit">送信する</button>
          </form>
        </Modal>
      </main>
    </PageShell>
  );
}
