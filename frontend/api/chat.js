import { apiRequest } from './client.js';

export function getActiveChat() {
  return apiRequest('/chat/active');
}

export function sendChatMessage(text) {
  return apiRequest('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
