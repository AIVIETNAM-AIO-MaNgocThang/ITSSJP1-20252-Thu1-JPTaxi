const CHAT_SESSION_KEY = 'jpTaxiActiveRide';

export const fallbackChatSession = {
  tripId: 'demo-trip-1',
  requestId: 'demo-request-1',
  customerId: 1,
  driverId: 1,
};

export function normalizeChatSession(session = {}) {
  return {
    ...fallbackChatSession,
    ...session,
    tripId: String(session.tripId ?? session.trip_id ?? fallbackChatSession.tripId),
    requestId: String(session.requestId ?? session.request_id ?? fallbackChatSession.requestId),
    customerId: Number(session.customerId ?? session.customer_id ?? fallbackChatSession.customerId),
    driverId: Number(session.driverId ?? session.driver_id ?? fallbackChatSession.driverId),
  };
}

export function getActiveChatSession() {
  try {
    const rawSession = window.sessionStorage.getItem(CHAT_SESSION_KEY);
    if (!rawSession) return fallbackChatSession;
    return normalizeChatSession(JSON.parse(rawSession));
  } catch {
    return fallbackChatSession;
  }
}

export function saveActiveChatSession(session) {
  const nextSession = normalizeChatSession(session);
  window.sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(nextSession));
  return nextSession;
}

export function getChatPath(audience, session = getActiveChatSession()) {
  const nextSession = normalizeChatSession(session);
  const params = new URLSearchParams({
    tripId: nextSession.tripId,
    requestId: nextSession.requestId,
  });
  return `/messages/${audience}?${params.toString()}`;
}
