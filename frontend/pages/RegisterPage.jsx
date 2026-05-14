import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import PasswordField from '../components/PasswordField.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/auth.css';

export default function RegisterPage() {
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

          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            <div className="field-grid two">
              <label>
                <span>姓</span>
                <input type="text" placeholder="姓を入力" />
              </label>
              <label>
                <span>名</span>
                <input type="text" placeholder="名を入力" />
              </label>
            </div>

            <label>
              <span>メールアドレス</span>
              <input type="email" placeholder="example@email.com" />
            </label>

            <div className="field-grid two">
              <label>
                <span>電話番号</span>
                <input type="tel" placeholder="電話番号を入力" />
              </label>
              <label>
                <span>性別</span>
                <select defaultValue="">
                  <option value="" disabled>選択してください</option>
                  <option>男性</option>
                  <option>女性</option>
                  <option>その他</option>
                </select>
              </label>
            </div>

            <div className="field-grid two">
              <PasswordField label="パスワード" placeholder="パスワードを入力" />
              <PasswordField label="パスワード確認" placeholder="もう一度入力" />
            </div>

            <label className="terms">
              <input type="checkbox" />
              <span>利用規約およびプライバシーポリシーに同意します</span>
            </label>

            <button className="submit-button" type="submit">登録</button>
            <p className="note-link">すでにアカウントをお持ちですか？ <Link to="/login">ログイン</Link></p>
          </form>
        </section>
      </section>
    </main>
    </PageShell>
  );
}
