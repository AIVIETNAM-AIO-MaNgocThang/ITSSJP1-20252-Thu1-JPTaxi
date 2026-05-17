import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/auth.css';
import '../styles/app-pages.css';

export default function DriverRegisterPage() {
  return (
    <PageShell withFooter={false}>
      <main className="driver-register-screen">
        <Topbar
          brandTo="/home"
          actions={(
            <>
              <Link to="/home">ホーム</Link>
              <Link to="/user-info/profile">アカウント</Link>
              <img className="topbar-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" alt="" />
            </>
          )}
        />

        <section className="driver-register-layout">
          <div className="driver-register-intro">
            <span className="eyebrow">🚖 ドライバー登録・免許更新</span>
            <h1>ドライバーとして登録し、JP TAXIで働きましょう</h1>
            <p>運転免許証や車両情報を登録すると、配車リクエストの受信やプロフィール管理ができるようになります。</p>

            <div className="driver-register-benefits">
              <article><strong>オンライン申請</strong><span>必要情報と本人確認書類をアップロードして、オンラインで申請できます。</span></article>
              <article><strong>免許更新対応</strong><span>有効期限の近い運転免許証を更新し、継続稼働に備えます。</span></article>
              <article><strong>審査後すぐ開始</strong><span>審査完了後、配車リクエストを受け取って運転を始められます。</span></article>
            </div>

            <div className="driver-register-steps">
              <article><span>1</span><div><strong>基本情報の入力</strong><small>氏名・電話番号・使用言語などのプロフィール情報を入力します。</small></div></article>
              <article><span>2</span><div><strong>免許証・本人確認書類の提出</strong><small>運転免許証や本人確認書類をアップロードして審査を受けます。</small></div></article>
              <article><span>3</span><div><strong>車両情報の登録</strong><small>車種・ナンバープレート・座席数などを入力して登録を完了します。</small></div></article>
            </div>
          </div>

          <section className="driver-register-form-card">
            <div className="form-logo" aria-hidden="true">🚕</div>
            <div className="form-heading">
              <h2>運転者登録</h2>
              <p>ドライバー登録、または運転免許・車両情報の更新を行ってください。</p>
            </div>

            <form className="auth-form driver-register-form" onSubmit={(event) => event.preventDefault()}>
              <div className="notice-box">現在の申請状況：<strong>未提出</strong><br />書類の審査には通常1〜2営業日かかります。</div>

              <h3 className="section-title">基本情報</h3>
              <div className="field-grid two">
                <label><span>姓</span><input placeholder="山田" /></label>
                <label><span>名</span><input placeholder="太郎" /></label>
                <label><span>電話番号</span><input placeholder="+84 000 000 000" /></label>
                <label><span>対応言語</span><select defaultValue="日本語"><option>日本語</option><option>日本語・ベトナム語</option></select></label>
              </div>

              <h3 className="section-title">運転免許情報</h3>
              <div className="field-grid two">
                <label><span>免許証番号</span><input placeholder="DL-123456789" /></label>
                <label><span>有効期限</span><input type="date" /></label>
              </div>
              <div className="upload-grid">
                <label className="upload-box">📄<strong>免許証（表）</strong><span>クリックしてアップロード</span><input type="file" hidden /></label>
                <label className="upload-box">🪪<strong>免許証（裏）</strong><span>クリックしてアップロード</span><input type="file" hidden /></label>
              </div>

              <h3 className="section-title">車両情報</h3>
              <div className="field-grid two">
                <label><span>車種</span><input placeholder="Toyota Vios" /></label>
                <label><span>ナンバープレート</span><input placeholder="30A-123.45" /></label>
                <label><span>座席数</span><select><option>4人乗り</option><option>7人乗り</option></select></label>
                <label><span>車両カラー</span><input placeholder="白" /></label>
              </div>
              <div className="upload-grid">
                <label className="upload-box">🚗<strong>車両写真</strong><span>車の外観写真をアップロード</span><input type="file" hidden /></label>
                <label className="upload-box">📘<strong>車検証</strong><span>登録書類をアップロード</span><input type="file" hidden /></label>
              </div>

              <label className="terms">
                <input type="checkbox" />
                <span>提出した情報が正確であり、ドライバー利用規約および審査ポリシーに同意します。</span>
              </label>

              <div className="driver-register-actions">
                <button className="secondary-button" type="button">一時保存</button>
                <Link className="submit-button" to="/register">申請を送信</Link>
              </div>
            </form>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
