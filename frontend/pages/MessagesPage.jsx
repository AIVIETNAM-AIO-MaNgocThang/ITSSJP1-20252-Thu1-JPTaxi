import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { apiRequest } from '../api/client.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getActiveChatSession, getChatPath, normalizeChatSession } from '../utils/chatSession.js';
import '../styles/app-pages.css';

const demoMessages = [
  {
    id: 'demo-1',
    senderRole: 'driver',
    content: 'こんにちは、田中です。現在向かっています。',
    createdAt: '2026-05-25T14:00:00+07:00',
  },
  {
    id: 'demo-2',
    senderRole: 'customer',
    content: '承知いたしました。ホテルのロビー入口で待っています。',
    createdAt: '2026-05-25T14:01:00+07:00',
  },
  {
    id: 'demo-3',
    senderRole: 'driver',
    content: 'ありがとうございます。黒色のトヨタ・ヴィオス、ナンバー「30A-123.45」です。',
    createdAt: '2026-05-25T14:02:00+07:00',
  },
];

function getStoredRole(audience) {
  if (localStorage.getItem('jpTaxiRole') === 'driver' || audience === 'customer') {
    return 'driver';
  }
  return 'customer';
}

function getMessageRole(message) {
  return message.senderRole || message.sender_role || message.role || 'customer';
}

function normalizeMessage(message, index) {
  return {
    id: message.id ?? message.messageId ?? message.message_id ?? `message-${index}`,
    senderRole: getMessageRole(message),
    content: message.content ?? message.message ?? message.text ?? '',
    createdAt: message.createdAt ?? message.created_at ?? message.sentAt ?? message.sent_at ?? new Date().toISOString(),
  };
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getThreadTitle(role) {
  return role === 'driver'
    ? { initial: '佐', name: '佐藤 お客様', status: '乗車地で待機中' }
    : { initial: '田', name: '田中 ドライバー', status: '走行中' };
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { audience } = useParams();
  const [searchParams] = useSearchParams();
  const role = getStoredRole(audience);
  const isDriver = role === 'driver';
  const homePath = isDriver ? '/driver-home' : '/home';
  const accountPath = isDriver ? '/driver-info/basic' : '/user-info';
  const session = useMemo(() => {
    const storedSession = getActiveChatSession();
    return normalizeChatSession({
      ...storedSession,
      tripId: searchParams.get('tripId') || storedSession.tripId,
      requestId: searchParams.get('requestId') || storedSession.requestId,
    });
  }, [searchParams]);
  const activeChat = getThreadTitle(role);
  const [messages, setMessages] = useState(demoMessages);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const viewportRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('jpTaxiToken');
    if (!token || !session.tripId || session.tripId.startsWith('demo-')) {
      setStatus('Backend chat chưa kết nối, đang hiển thị hội thoại mẫu.');
      return undefined;
    }

    let ignore = false;

    async function loadMessages() {
      try {
        const data = await apiRequest(`/chats/${session.tripId}/messages`);
        const rows = Array.isArray(data) ? data : data?.messages ?? data?.data ?? [];
        if (!ignore) {
          setMessages(rows.map(normalizeMessage));
          setStatus('');
        }
      } catch (error) {
        if (!ignore) {
          setStatus(error instanceof Error ? error.message : 'Không tải được tin nhắn.');
        }
      }
    }

    loadMessages();
    const timerId = window.setInterval(loadMessages, 6000);
    return () => {
      ignore = true;
      window.clearInterval(timerId);
    };
  }, [session.tripId]);

  useEffect(() => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages.length]);

  async function sendMessage(content) {
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      senderRole: role,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft('');

    const token = localStorage.getItem('jpTaxiToken');
    if (!token || session.tripId.startsWith('demo-')) {
      setStatus('Tin nhắn đang ở chế độ demo. Backend chat chưa sẵn sàng để lưu.');
      return;
    }

    try {
      const savedMessage = await apiRequest(`/chats/${session.tripId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: trimmedContent }),
      });
      setMessages((current) =>
        current.map((message) =>
          message.id === optimisticMessage.id ? normalizeMessage(savedMessage, current.length) : message,
        ),
      );
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không gửi được tin nhắn.');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(draft);
  }

  const threadItems = [
    {
      initial: activeChat.initial,
      name: activeChat.name,
      text: messages[messages.length - 1]?.content || 'Chưa có tin nhắn',
      active: true,
    },
  ];

  return (
    <PageShell>
      <main className="messages-window">
        <Topbar brandTo={homePath} />

        <section className="zip-chat-container">
          <aside className="zip-chat-sidebar">
            <h1>{t('navMessages')}</h1>
            <div className="zip-chat-list">
              {threadItems.map((item) => (
                <Link
                  className={`zip-chat-item ${item.active ? 'active' : ''}`}
                  key={item.name}
                  to={getChatPath(isDriver ? 'customer' : 'driver', session)}
                >
                  <span className="zip-avatar">{item.initial}</span>
                  <span className="zip-chat-info">
                    <span><strong>{item.name}</strong><small>Trip {session.tripId}</small></span>
                    <em>{item.text}</em>
                  </span>
                </Link>
              ))}
            </div>
          </aside>

          <section className="zip-main-chat">
            <header className="zip-chat-header">
              <div>
                <span className="zip-avatar small">{activeChat.initial}</span>
                <span><strong>{activeChat.name}</strong><small>{activeChat.status}</small></span>
              </div>
              <Link className="chat-back-link" to={isDriver ? '/driver-ride-status' : '/ride-status'}>戻る</Link>
            </header>

            <div className="zip-messages-viewport" ref={viewportRef}>
              {messages.map((message, index) => {
                const senderRole = getMessageRole(message);
                const direction = senderRole === role ? 'sent' : 'received';
                return (
                  <p className={`msg ${direction}`} key={message.id ?? index}>
                    {message.content}
                    <span>{formatTime(message.createdAt)}</span>
                  </p>
                );
              })}
            </div>

            <footer className="zip-input-area">
              {status && <div className="chat-status" role="status">{status}</div>}
              <div className="quick-replies">
                {['今どこですか？', '着きました！', '少し遅れます', '了解です'].map((reply) => (
                  <button type="button" key={reply} onClick={() => sendMessage(reply)}>{reply}</button>
                ))}
              </div>
              <form className="zip-input-box" onSubmit={handleSubmit}>
                <span>💬</span>
                <input
                  type="text"
                  placeholder="メッセージを入力..."
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" aria-label="Send message">➤</button>
              </form>
            </footer>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
