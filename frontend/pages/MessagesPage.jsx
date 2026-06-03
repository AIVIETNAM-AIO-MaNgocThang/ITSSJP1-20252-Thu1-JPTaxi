import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getCustomerProfile, getDriverProfile, resolveAssetUrl } from '../api/accounts.js';
import { getActiveChat, getChatByTrip, getChatConversations, sendChatMessage } from '../api/chat.js';
import PageShell from '../components/PageShell.jsx';
import Topbar from '../components/Topbar.jsx';
import { useLanguage } from '../i18n/LanguageProvider.jsx';
import '../styles/app-pages.css';

const customerAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80';
const driverAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';
const CHAT_HISTORY_KEY = 'jpTaxiChatHistory';
const CHAT_HIDDEN_KEY = 'jpTaxiHiddenChats';

function getCurrentRole(audience) {
  if (audience === 'customer') return 'driver';
  if (audience === 'driver') return 'customer';
  return sessionStorage.getItem('jpTaxiActiveRole') || localStorage.getItem('jpTaxiRole') || 'customer';
}

function validTripId(value) {
  const raw = String(value || '');
  return /^\d+$/.test(raw) ? raw : '';
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

function readCachedConversations(role) {
  try {
    const all = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
    return Array.isArray(all[role]) ? all[role] : [];
  } catch {
    return [];
  }
}

function readHiddenChatIds(role) {
  try {
    const all = JSON.parse(localStorage.getItem(CHAT_HIDDEN_KEY) || '{}');
    return new Set(Array.isArray(all[role]) ? all[role].map(String) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenChatIds(role, ids) {
  try {
    const all = JSON.parse(localStorage.getItem(CHAT_HIDDEN_KEY) || '{}');
    all[role] = [...ids].map(String);
    localStorage.setItem(CHAT_HIDDEN_KEY, JSON.stringify(all));
  } catch {
    /* Ignore local hide failures. */
  }
}

function mergeConversations(...groups) {
  const byTrip = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    const tripId = item.trip?.tripId ? String(item.trip.tripId) : '';
    if (!tripId) return;
    const existing = byTrip.get(tripId);
    byTrip.set(tripId, {
      ...existing,
      ...item,
      lastMessage: item.lastMessage || existing?.lastMessage || null,
    });
  });
  return [...byTrip.values()].sort((a, b) => {
    if (Boolean(a.available) !== Boolean(b.available)) {
      return a.available ? -1 : 1;
    }
    const left = new Date(a.lastMessage?.createdAt || 0).getTime();
    const right = new Date(b.lastMessage?.createdAt || 0).getTime();
    return right - left;
  });
}

function saveChatSnapshot(role, chatData) {
  if (!chatData?.trip?.tripId) return;
  const nextItem = {
    available: Boolean(chatData.available),
    partner: chatData.partner || null,
    participants: chatData.participants || null,
    trip: chatData.trip,
    lastMessage: Array.isArray(chatData.messages) && chatData.messages.length
      ? chatData.messages[chatData.messages.length - 1]
      : null,
    messages: Array.isArray(chatData.messages) ? chatData.messages : [],
  };

  try {
    const all = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || '{}');
    all[role] = mergeConversations([nextItem], Array.isArray(all[role]) ? all[role] : []).slice(0, 30);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(all));
  } catch {
    /* Cache is best-effort; DB remains the source of truth. */
  }
}

function cachedChatForTrip(role, tripId) {
  const item = readCachedConversations(role)
    .find((conversation) => String(conversation.trip?.tripId || '') === String(tripId || ''));
  if (!item) return null;
  return {
    available: Boolean(item.available),
    trip: item.trip || null,
    partner: item.partner || null,
    participants: item.participants || null,
    messages: Array.isArray(item.messages) ? item.messages : (item.lastMessage ? [item.lastMessage] : []),
    message: item.available ? '' : 'このチャットは終了した乗車の履歴です。',
  };
}

export default function MessagesPage() {
  const { audience } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const role = getCurrentRole(audience);
  const isDriver = role === 'driver';
  const [chat, setChat] = useState({ available: false, messages: [], trip: null, partner: null, participants: null });
  const [selectedTripId, setSelectedTripId] = useState(() => validTripId(searchParams.get('tripId')));
  const [conversations, setConversations] = useState([]);
  const [hiddenChatIds, setHiddenChatIds] = useState(() => readHiddenChatIds(role));
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
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
      const requestedTripId = validTripId(selectedTripId);
      const [history, activeData] = await Promise.all([
        getChatConversations().catch(() => []),
        getActiveChat().catch(() => null),
      ]);
      let data;
      const activeTripId = validTripId(activeData?.trip?.tripId);
      if (requestedTripId && requestedTripId !== activeTripId) {
        try {
          data = await getChatByTrip(requestedTripId);
        } catch (error) {
          const cachedChat = cachedChatForTrip(role, requestedTripId);
          if (!cachedChat) throw error;
          data = cachedChat;
        }
      } else {
        data = activeData;
      }
      let partner = data?.partner || null;
      let participants = data?.participants || null;

      if (data?.trip) {
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

      const nextChat = {
        available: Boolean(data?.available),
        trip: data?.trip || null,
        partner,
        participants,
        messages: Array.isArray(data?.messages) ? data.messages : [],
        message: data?.message || '',
      };
      saveChatSnapshot(role, nextChat);
      setConversations(mergeConversations(
        Array.isArray(history) ? history : [],
        readCachedConversations(role),
      ));

      const nextTripId = String(nextChat.trip?.tripId || '');
      if (!nextTripId || !readHiddenChatIds(role).has(nextTripId)) {
        setChat(nextChat);
      }
      if (!silent) setStatus('');
    } catch (error) {
      if (!silent) setStatus(error.message || t('chat.loadFailed'));
    }
  }

  useEffect(() => {
    sessionStorage.setItem('jpTaxiActiveRole', role);
    setCurrentAccount(storedAccount(role));
    setHiddenChatIds(readHiddenChatIds(role));
    loadChat();
    const timer = window.setInterval(() => loadChat({ silent: true }), 1000);
    return () => window.clearInterval(timer);
  }, [role, selectedTripId]);

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
      setChat((current) => {
        const nextChat = {
          ...current,
          messages: [...current.messages, message],
        };
        saveChatSnapshot(role, nextChat);
        setConversations(mergeConversations([{
          available: nextChat.available,
          partner: nextChat.partner,
          participants: nextChat.participants,
          trip: nextChat.trip,
          lastMessage: message,
        }], conversations, readCachedConversations(role)));
        return nextChat;
      });
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
  const activeConversationItem = hasConversation ? {
    available: chat.available,
    partner: chat.partner,
    participants: chat.participants,
    trip: chat.trip,
    lastMessage,
    messages: chat.messages,
  } : null;
  const conversationItems = mergeConversations(
    conversations,
    activeConversationItem ? [activeConversationItem] : [],
  ).filter((item) => !hiddenChatIds.has(String(item.trip?.tripId || '')));

  function getConversationPartner(item) {
    return accountName(item.partner) || item.lastMessage?.senderName || '';
  }

  function getConversationAvatar(item) {
    return resolveAssetUrl(item.partner?.avatarUrl) || (isDriver ? customerAvatar : driverAvatar);
  }

  function openConversation(item) {
    const itemTripId = validTripId(item.trip?.tripId);
    setSelectedTripId(itemTripId);
    if (Array.isArray(item.messages) && item.messages.length) {
      setChat({
        available: Boolean(item.available),
        trip: item.trip || null,
        partner: item.partner || null,
        participants: item.participants || null,
        messages: item.messages,
        message: item.available ? '' : 'このチャットは終了した乗車の履歴です。',
      });
      setStatus('');
    }
  }

  function requestDeleteConversation(event, item) {
    event.stopPropagation();
    const itemTripId = validTripId(item.trip?.tripId);
    if (!itemTripId) return;
    setPendingDelete(item);
  }

  function closeDeleteDialog() {
    setPendingDelete(null);
  }

  function confirmDeleteConversation() {
    if (!pendingDelete) return;
    const itemTripId = validTripId(pendingDelete.trip?.tripId);
    if (!itemTripId) return;
    const nextHiddenIds = new Set(hiddenChatIds);
    nextHiddenIds.add(itemTripId);
    saveHiddenChatIds(role, nextHiddenIds);
    setHiddenChatIds(nextHiddenIds);
    if (String(chat.trip?.tripId || '') === itemTripId) {
      setSelectedTripId('');
      setChat({ available: false, messages: [], trip: null, partner: null, participants: null, message: 'Không có đoạn chat.' });
      setDraft('');
      setStatus('');
    }
    setPendingDelete(null);
  }

  return (
    <PageShell>
      <main className="messages-window">
        <Topbar brandTo={header.brandTo} actions={header.actions} />

        <section className="zip-chat-container">
          <aside className="zip-chat-sidebar">
            <h1>{t('chat.title')}</h1>
            <div className="zip-chat-list">
              {conversationItems.length ? (
                conversationItems.map((item) => {
                  const itemTripId = item.trip?.tripId ? String(item.trip.tripId) : '';
                  const itemPartnerName = getConversationPartner(item);
                  const itemAvatar = getConversationAvatar(item);
                  const itemInitial = itemPartnerName.trim().charAt(0).toUpperCase() || (isDriver ? 'K' : 'T');
                  const isActive = itemTripId && String(chat.trip?.tripId) === itemTripId;
                  return (
                    <div
                      className={`zip-chat-item ${isActive ? 'active' : ''}`}
                      key={itemTripId || item.lastMessage?.id || itemPartnerName}
                      onClick={() => openConversation(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') openConversation(item);
                      }}
                    >
                      {itemAvatar ? <img className="zip-avatar image" src={itemAvatar} alt={itemPartnerName} /> : <span className="zip-avatar">{itemInitial}</span>}
                      <span className="zip-chat-info">
                        <span>{itemPartnerName && <strong>{itemPartnerName}</strong>}<small>{item.lastMessage ? formatTime(item.lastMessage.createdAt) : '-'}</small></span>
                        <em>{item.lastMessage?.text || (item.available ? t('chat.noHistory') : unavailableText)}</em>
                      </span>
                      <button className="zip-chat-delete" type="button" title="Xóa đoạn chat" aria-label="Xóa đoạn chat" onClick={(event) => requestDeleteConversation(event, item)}>×</button>
                    </div>
                  );
                })
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
        {pendingDelete ? (
          <div className="zip-delete-backdrop" role="presentation" onClick={closeDeleteDialog}>
            <section className="zip-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="delete-chat-title">Xóa đoạn chat?</h2>
              <p>Đoạn chat này sẽ bị ẩn khỏi danh sách của bạn. Người còn lại vẫn xem được.</p>
              <div>
                <button type="button" onClick={closeDeleteDialog}>Hủy</button>
                <button className="danger" type="button" onClick={confirmDeleteConversation}>Đồng ý</button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </PageShell>
  );
}
