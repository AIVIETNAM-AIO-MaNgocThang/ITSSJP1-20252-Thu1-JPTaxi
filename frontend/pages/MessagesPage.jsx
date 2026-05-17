import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import '../styles/app-pages.css';

const conversations = [
  { initial: '田', name: '田中 ドライバー', time: '14:02', text: 'ありがとうございます。黒色のトヨタ・ヴィオスです。', active: true },
  { initial: 'サ', name: 'サポートセンター', time: '昨日', text: 'お問い合わせの件につきまして、担当者が確認中です。' },
];

export default function MessagesPage() {
  const { audience } = useParams();
  const isDriver = localStorage.getItem('jpTaxiRole') === 'driver' || audience === 'customer';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const messagePath = isDriver ? '/messages/customer' : '/messages/driver';
  const activeChat = isDriver
    ? { initial: '佐', name: '佐藤 お客様', status: '乗車地点で待機中' }
    : { initial: '田', name: '田中 ドライバー', status: '走行中 (あと3分で到着)' };

  return (
    <PageShell>
      <main className="messages-window">
        <Topbar brandTo={homePath} actions={<><Link to={homePath}>ホーム</Link><Link to={messagePath} className="active-header-link">メッセージ</Link><Link to={accountPath}>アカウント</Link></>} />

        <section className="zip-chat-container">
          <aside className="zip-chat-sidebar">
            <h1>メッセージ</h1>
            <div className="zip-chat-list">
              {conversations.map((item) => (
                <button className={`zip-chat-item ${item.active ? 'active' : ''}`} type="button" key={item.name}>
                  <span className="zip-avatar">{item.initial}</span>
                  <span className="zip-chat-info">
                    <span><strong>{item.name}</strong><small>{item.time}</small></span>
                    <em>{item.text}</em>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="zip-main-chat">
            <header className="zip-chat-header">
              <div>
                <span className="zip-avatar small">{activeChat.initial}</span>
                <span><strong>{activeChat.name}</strong><small>{activeChat.status}</small></span>
              </div>
              <button type="button" aria-label="電話">📞</button>
            </header>

            <div className="zip-messages-viewport">
              <p className="msg received">こんにちは、田中です。現在向かっています。<span>14:00</span></p>
              <p className="msg sent">承知いたしました。ホテルのロビー入り口で待っています。<span>14:01</span></p>
              <p className="msg received">ありがとうございます。黒色のトヨタ・ヴィオス、ナンバー「30A-123.45」です。まもなく到着します。<span>14:02</span></p>
            </div>

            <footer className="zip-input-area">
              <div className="quick-replies">
                {['今どこですか？', '着きました！', '少し遅れます', '了解です'].map((reply) => <button type="button" key={reply}>{reply}</button>)}
              </div>
              <div className="zip-input-box">
                <span>📎</span>
                <input type="text" placeholder="メッセージを入力..." />
                <button type="button">➤</button>
              </div>
            </footer>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
