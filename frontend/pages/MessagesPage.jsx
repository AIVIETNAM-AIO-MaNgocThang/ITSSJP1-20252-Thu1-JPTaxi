import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCustomerProfile, getDriverProfile, resolveAssetUrl } from '../api/accounts.js';
import { getActiveChat, sendChatMessage } from '../api/chat.js';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import '../styles/app-pages.css';

const customerAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const driverAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

function getCurrentRole(audience) {
  if (audience === 'customer') return 'driver';
  if (audience === 'driver') return 'customer';
  return sessionStorage.getItem('jpTaxiActiveRole') || localStorage.getItem('jpTaxiRole') || 'customer';
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function accountFullName(account, fallback) {
  const fullName = [account?.lastName, account?.firstName].filter(Boolean).join(' ').trim();
  return fullName || account?.name || fallback;
}

function accountName(account) {
  return accountFullName(account, '');
}

function normalizeParticipant(profile, role, id) {
  if (!profile) return null;
  return {
    id,
    role,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    name: [profile.lastName, profile.firstName].filter(Boolean).join(' ').trim(),
    email: profile.email || '',
    phone: profile.phone || '',
    avatarUrl: profile.avatarUrl || '',
  };
}

function needsProfileDetails(participant) {
  if (!participant) return true;
  const hasName = Boolean(
    participant.name
      || participant.firstName
      || participant.lastName,
  );
  return !hasName || !participant.avatarUrl;
}

function mergeParticipant(participant, profile, role, id) {
  const normalized = normalizeParticipant(profile, role, id);
  if (!normalized) return participant || null;

  return {
    ...participant,
    ...normalized,
    name: normalized.name || participant?.name || '',
    avatarUrl: normalized.avatarUrl || participant?.avatarUrl || '',
  };
}

function storedAccount(role) {
  const prefix = role === 'driver' ? 'jpTaxiDriver' : 'jpTaxiCustomer';
  return {
    firstName: localStorage.getItem(`${prefix}FirstName`) || '',
    lastName: localStorage.getItem(`${prefix}LastName`) || '',
    email: localStorage.getItem(`${prefix}Email`) || localStorage.getItem('jpTaxiUserEmail') || '',
    avatarUrl: localStorage.getItem(`${prefix}AvatarUrl`) || '',
  };
}

function rememberAccount(role, profile) {
  if (!profile) return;
  const prefix = role === 'driver' ? 'jpTaxiDriver' : 'jpTaxiCustomer';
  localStorage.setItem(`${prefix}FirstName`, profile.firstName || '');
  localStorage.setItem(`${prefix}LastName`, profile.lastName || '');
  localStorage.setItem(`${prefix}AvatarUrl`, resolveAssetUrl(profile.avatarUrl) || '');
}

export default function MessagesPage() {
  const { audience } = useParams();
  const { t } = useLanguage();
  const role = getCurrentRole(audience);
  const isDriver = role === 'driver';
  const [chat, setChat] = useState({ available: false, messages: [], trip: null, partner: null, participants: null });
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(() => storedAccount(role));
  const viewportRef = useRef(null);

  const header = useMemo(() => {
    const homePath = isDriver ? '/driver-home' : '/home';
    const accountPath = isDriver ? '/driver-info/basic' : '/user-info/profile';
    const messagePath = isDriver ? '/messages/customer' : '/messages/driver';
    const avatar = resolveAssetUrl(currentAccount.avatarUrl) || (isDriver ? driverAvatar : customerAvatar);

    return {
      brandTo: homePath,
      actions: (
        <>
          <Link to={homePath}>{t('common.home')}</Link>
          <Link to={messagePath} className="active-header-link">{t('common.messages')}</Link>
          <Link to={accountPath}>{t('common.account')}</Link>
          <img className="topbar-avatar" src={avatar} alt={accountFullName(currentAccount, '')} />
        </>
      ),
    };
  }, [currentAccount, isDriver, t]);

  async function loadChat({ silent = false } = {}) {
    try {
      const data = await getActiveChat();
      let partner = data?.partner || null;
      let participants = data?.participants || null;

      if (data?.available && data?.trip) {
        try {
          const [customerProfile, driverProfile] = await Promise.all([
            needsProfileDetails(participants?.customer) ? getCustomerProfile(data.trip.customerId) : Promise.resolve(null),
            needsProfileDetails(participants?.driver) ? getDriverProfile(data.trip.driverId) : Promise.resolve(null),
          ]);

          participants = {
            customer: mergeParticipant(participants?.customer, customerProfile, 'customer', data.trip.customerId),
            driver: mergeParticipant(participants?.driver, driverProfile, 'driver', data.trip.driverId),
          };
          partner = role === 'driver' ? participants.customer : participants.driver;
        } catch {
          /* Keep chat usable even if profile enrichment fails. */
        }
      }

      setChat({
        available: Boolean(data?.available),
        trip: data?.trip || null,
        partner,
        participants,
        messages: Array.isArray(data?.messages) ? data.messages : [],
        message: data?.message || '',
      });
      if (!silent) setStatus('');
    } catch (error) {
      if (!silent) setStatus(error.message || t('chat.loadFailed'));
    }
  }

  useEffect(() => {
    sessionStorage.setItem('jpTaxiActiveRole', role);
    setCurrentAccount(storedAccount(role));
    loadChat();
    const timer = window.setInterval(() => loadChat({ silent: true }), 1000);
    return () => window.clearInterval(timer);
  }, [role]);

  useEffect(() => {
    let ignore = false;
    const loadCurrentAccount = isDriver ? getDriverProfile : getCustomerProfile;
    loadCurrentAccount()
      .then((profile) => {
        if (ignore) return;
        const normalized = normalizeParticipant(profile, role, isDriver ? profile?.driverId : profile?.customerId);
        rememberAccount(role, normalized);
        setCurrentAccount(normalized || storedAccount(role));
      })
      .catch(() => {
        if (!ignore) setCurrentAccount(storedAccount(role));
      });
    return () => {
      ignore = true;
    };
  }, [isDriver, role]);

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages.length]);

  async function submitMessage(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending || !chat.available) return;

    setSending(true);
    setDraft('');
    try {
      const message = await sendChatMessage(text);
      setChat((current) => ({
        ...current,
        messages: [...current.messages, message],
      }));
      setStatus('');
    } catch (error) {
      setDraft(text);
      setStatus(error.message || t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  }

  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastPartnerMessage = [...chat.messages].reverse().find((message) => message.senderRole !== role);
  const inferredPartnerName = lastPartnerMessage?.senderName || '';
  const hasConversation = Boolean(chat.partner || chat.messages.length);
  const partnerName = hasConversation ? accountName(chat.partner) || inferredPartnerName : '';
  const partnerInitial = partnerName.trim().charAt(0).toUpperCase() || (isDriver ? 'K' : 'T');
  const partnerAvatar = resolveAssetUrl(chat.partner?.avatarUrl) || (hasConversation ? (isDriver ? customerAvatar : driverAvatar) : '');
  const unavailableText = chat.message || t('chat.waiting');
  const currentAccountName = accountName(currentAccount);
  const senderNames = {
    customer: role === 'customer' ? currentAccountName : partnerName,
    driver: role === 'driver' ? currentAccountName : partnerName,
  };

  return (
    <PageShell>
      <main className="messages-window">
        <Topbar brandTo={header.brandTo} actions={header.actions} />

        <section className="zip-chat-container">
          <aside className="zip-chat-sidebar">
            <h1>{t('chat.title')}</h1>
            <div className="zip-chat-list">
              {hasConversation ? (
                <button className={`zip-chat-item ${chat.available ? 'active' : ''}`} type="button">
                  {partnerAvatar ? <img className="zip-avatar image" src={partnerAvatar} alt={partnerName} /> : <span className="zip-avatar">{partnerInitial}</span>}
                  <span className="zip-chat-info">
                    <span>{partnerName && <strong>{partnerName}</strong>}<small>{lastMessage ? formatTime(lastMessage.createdAt) : '-'}</small></span>
                    <em>{lastMessage?.text || (chat.available ? t('chat.noHistory') : unavailableText)}</em>
                  </span>
                </button>
              ) : (
                <p className="zip-chat-empty sidebar-empty">{unavailableText}</p>
              )}
            </div>
          </aside>

          <section className="zip-main-chat">
            <header className="zip-chat-header">
              <div>
                {partnerAvatar ? <img className="zip-avatar small image" src={partnerAvatar} alt={partnerName} /> : <span className="zip-avatar small">{partnerInitial}</span>}
                <span>
                  {partnerName && <strong>{partnerName}</strong>}
                  <small>{chat.available ? t('chat.active') : t('chat.waiting')}</small>
                </span>
              </div>
            </header>

            <div className="zip-messages-viewport" ref={viewportRef}>
              {!chat.available && !chat.messages.length && <p className="zip-chat-empty">{unavailableText}</p>}
              {chat.available && !chat.messages.length && <p className="zip-chat-empty">{t('chat.noHistory')}</p>}
              {chat.messages.map((message) => {
                const sentByMe = message.senderRole === role;
                const senderName = senderNames[message.senderRole] || message.senderName || (sentByMe ? currentAccountName : partnerName);
                return (
                  <p className={`msg ${sentByMe ? 'sent' : 'received'}`} key={message.id}>
                    <strong className="zip-message-sender">{senderName}</strong>
                    <span className="zip-message-body">{message.text}</span>
                    <span className="zip-message-time">{formatTime(message.createdAt)}</span>
                  </p>
                );
              })}
            </div>

            <footer className="zip-input-area">
              <form className="zip-input-box" onSubmit={submitMessage}>
                <input
                  type="text"
                  placeholder={t('chat.inputPlaceholder')}
                  value={draft}
                  disabled={!chat.available}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" disabled={sending || !draft.trim() || !chat.available}>{sending ? '...' : t('common.send')}</button>
              </form>
              {status && <p className="zip-chat-status">{status}</p>}
            </footer>
          </section>
        </section>
      </main>
    </PageShell>
  );
}
