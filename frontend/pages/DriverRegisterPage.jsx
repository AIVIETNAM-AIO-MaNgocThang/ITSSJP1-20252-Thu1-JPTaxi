import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/auth.css';
import '../styles/app-pages.css';

export default function DriverRegisterPage() {
  return (
    <PageShell withFooter={false}>
      <main className="auth-screen">
        <Topbar brandTo="/login" />
        <section className="auth-layout">
          <div className="intro">
            <span className="eyebrow">🚖 ドライバー登録</span>
            <h1>JP TAXIでドライバーとして働きましょう</h1>
            <p>運転免許証、本人確認書類、車両情報を登録すると、審査後に配車リクエストを受け取れるようになります。</p>
            <div className="benefits">
              <article><h2>オンライン申請</h2><p>基本情報と必要書類をひとつのフォームで提出できます。</p></article>
              <article><h2>免許情報の管理</h2><p>免許証番号、有効期限、書類画像をまとめて管理できます。</p></article>
              <article><h2>車両プロフィール</h2><p>車種、ナンバー、座席数、車検証を登録して審査に進めます。</p></article>
            </div>
          </div>

          <section className="auth-card driver-register-card">
            <div className="form-logo" aria-hidden="true">🚖</div>
            <div className="form-heading">
              <h2>運転者登録</h2>
              <p>ドライバー申請に必要な情報を入力してください。</p>
            </div>

            <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
              <div className="notice-box">現在の申請状況：<strong>未提出</strong><br />書類の審査には通常1〜2営業日かかります。</div>
              <h3 className="section-title">基本情報</h3>
              <div className="field-grid two">
                <label><span>姓</span><input placeholder="山田" /></label>
                <label><span>名</span><input placeholder="太郎" /></label>
                <label><span>電話番号</span><input placeholder="+84 000 000 000" /></label>
                <label><span>対応言語</span><select><option>日本語</option><option>日本語・ベトナム語</option></select></label>
              </div>

              <h3 className="section-title">運転免許情報</h3>
              <div className="field-grid two">
                <label><span>免許証番号</span><input placeholder="DL-123456789" /></label>
                <label><span>有効期限</span><input type="date" /></label>
              </div>
              <div className="upload-grid">
                <label className="upload-box">📄<strong>免許証（表）</strong><span>クリックしてアップロード</span><input type="file" hidden /></label>
                <label className="upload-box">📄<strong>免許証（裏）</strong><span>クリックしてアップロード</span><input type="file" hidden /></label>
              </div>

              <h3 className="section-title">車両情報</h3>
              <div className="field-grid two">
                <label><span>車種</span><input placeholder="Toyota Vios" /></label>
                <label><span>ナンバープレート</span><input placeholder="30A-123.45" /></label>
                <label><span>座席数</span><select><option>4人乗り</option><option>7人乗り</option></select></label>
                <label><span>車両カラー</span><input placeholder="白" /></label>
              </div>

              <button className="submit-button" type="submit">申請を送信</button>
            </form>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
