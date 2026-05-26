import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { registerCustomer } from '../api/auth.js';
import { ApiError } from '../api/client.js';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import Topbar from '../components/Topbar.jsx';
import { emailPattern } from '../utils/loginValidation.js';
import '../styles/auth.css';

const genderOptions = [
  { value: 'Male', label: '男性' },
  { value: 'Female', label: '女性' },
  { value: 'Other', label: 'その他' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!lastName.trim() || !firstName.trim()) {
      setError('姓と名を入力してください。');
      return;
    }
    if (!emailPattern.test(email.trim())) {
      setError('正しいメールアドレスを入力してください。');
      return;
    }
    if (!phone.trim()) {
      setError('電話番号を入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。');
      return;
    }
    if (password !== confirmPassword) {
      setError('確認用パスワードが一致しません。');
      return;
    }
    if (!agree) {
      setError('利用規約への同意が必要です。');
      return;
    }

    setSubmitting(true);
    try {
      await registerCustomer({
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        gender,
      });
      setStatus('登録が完了しました。ログインしてください。');
      window.setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : '登録に失敗しました。しばらくしてから再度お試しください。',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell withFooter={false}>
      <main className="auth-screen">
        <Topbar />

        <section className="auth-layout">
          <div className="intro">
            <span className="eyebrow">✨ 新規アカウント作成</span>
            <h1>JP TAXIをはじめましょう</h1>
            <p>新しいアカウントを作成すると、日本語対応のタクシー予約、履歴確認、メッセージ機能などをご利用いただけます。</p>

            <div className="benefits" aria-label="サービスの特徴">
              <article>
                <h2>簡単登録</h2>
                <p>必要情報を入力するだけで、すぐにアカウントを作成できます。</p>
              </article>
              <article>
                <h2>予約管理</h2>
                <p>配車予約から履歴の確認まで、一つのアカウントでまとめて管理できます。</p>
              </article>
              <article>
                <h2>安心の利用</h2>
                <p>日本語対応の画面とサポートで、初めてでも安心して利用できます。</p>
              </article>
            </div>
          </div>

          <section className="auth-card" aria-labelledby="register-title">
            <div className="form-logo" aria-hidden="true">🚕</div>
            <div className="form-heading">
              <h2 id="register-title">顧客登録</h2>
              <p>必要情報を入力して、新しいアカウントを作成してください。</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
              <div className="field-grid two">
                <label>
                  <span>姓</span>
                  <input
                    type="text"
                    placeholder="姓を入力"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>名</span>
                  <input
                    type="text"
                    placeholder="名を入力"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                <span>メールアドレス</span>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <div className="field-grid two">
                <label>
                  <span>電話番号</span>
                  <input
                    type="tel"
                    placeholder="電話番号を入力"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>性別</span>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    {genderOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <PasswordField
                label="パスワード"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <PasswordField
                label="パスワード確認"
                placeholder="もう一度入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <label className="terms">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <span>利用規約およびプライバシーポリシーに同意します</span>
              </label>

              <span className="field-error" aria-live="polite">{error}</span>
              <div className={`form-status ${status ? 'show' : ''}`} role="status" aria-live="polite">
                {status}
              </div>

              <button className="submit-button" type="submit" disabled={submitting}>
                {submitting ? '登録中...' : '登録'}
              </button>
              <p className="note-link">
                すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link>
              </p>
            </form>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
