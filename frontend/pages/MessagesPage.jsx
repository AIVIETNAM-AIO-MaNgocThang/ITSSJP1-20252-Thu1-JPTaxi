import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const conversations = [
  { name: '田中 ドライバー', text: 'あと3分で到着します。', active: true },
  { name: 'JP TAXI サポート', text: 'ご予約内容を確認しました。' },
  { name: '山本 ドライバー', text: '前回のご利用ありがとうございました。' },
];

export default function MessagesPage() {
  return (
    <PageShell>
      <main className="app-screen">
        <Topbar />
        <section className="app-shell">
          <div className="profile-header">
            <div>
              <h1>メッセージ</h1>
              <p>ドライバーやサポートとの連絡を確認できます。</p>
            </div>
          </div>

          <div className="messages-layout">
            <aside className="message-list">
              {conversations.map((item) => (
                <button className={`message-item ${item.active ? 'active' : ''}`} type="button" key={item.name}>
                  <strong>{item.name}</strong>
                  <span>{item.text}</span>
                </button>
              ))}
            </aside>

            <section className="chat-panel">
              <div className="chat-header">
                <strong>田中 ドライバー</strong>
                <p>トヨタ・クラウン / 30A-123.45</p>
              </div>
              <div className="chat-body">
                <p className="bubble">ご予約ありがとうございます。現在向かっています。</p>
                <p className="bubble me">ホアンキエム湖の入口で待っています。</p>
                <p className="bubble">承知しました。あと3分で到着します。</p>
              </div>
              <div className="chat-input">
                <input type="text" placeholder="メッセージを入力" />
                <button className="submit-button" type="button">送信</button>
              </div>
            </section>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
