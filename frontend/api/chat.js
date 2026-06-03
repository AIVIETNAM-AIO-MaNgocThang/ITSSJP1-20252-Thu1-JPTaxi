import { apiRequest } from './client.js';

export function getActiveChat() {
  return apiRequest('/chat/active');
}

export function getChatConversations() {
  return apiRequest('/chat/conversations');
}

export function getChatByTrip(tripId) {
  return apiRequest(`/chat/trips/${tripId}`);
}

export function sendChatMessage(text) {
  return apiRequest('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
