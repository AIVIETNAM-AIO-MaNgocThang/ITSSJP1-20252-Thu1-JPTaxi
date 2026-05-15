import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import '../styles/app-pages.css';

const tags = ['丁寧な対応', '安全運転', '車内が清潔', 'ルートが最適', '日本語が堪能'];

export default function DriverReviewPage() {
  return (
    <PageShell withFooter={false}>
      <main className="review-screen">
        <section className="rating-window">
          <header className="review-topbar">
            <Link to="/home">×</Link>
            <strong>フィードバック</strong>
            <Link to="/home">送信</Link>
          </header>

          <div className="review-content">
            <div className="driver-avatar-ring">
              <div className="review-driver-avatar">田</div>
            </div>
            <h1>田中 ドライバー</h1>
            <p>Toyota Vios • 30A-123.45</p>

            <section className="review-rating">
              <strong>今回の乗車はいかがでしたか？</strong>
              <div className="review-stars" aria-label="5 stars">
                {[1, 2, 3, 4, 5].map((star) => <button type="button" key={star}>★</button>)}
              </div>
              <span>素晴らしい!</span>
            </section>

            <section className="review-tags">
              <strong>良かった点（複数選択可）</strong>
              <div>
                {tags.map((tag, index) => <button className={index < 2 ? 'selected' : ''} type="button" key={tag}>{tag}</button>)}
              </div>
            </section>

            <textarea className="review-comment" placeholder="ドライバーへのメッセージ（任意）" />
            <Link className="review-submit" to="/home">評価を送信する</Link>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
