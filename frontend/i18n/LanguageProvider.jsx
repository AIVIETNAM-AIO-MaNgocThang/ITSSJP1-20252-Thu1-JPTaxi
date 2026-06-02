import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getStoredProfileLanguage,
  languageOptions,
  profileText,
  setStoredProfileLanguage,
} from './profileLanguage.js';

const appText = {
  ja: {
    common: {
      home: 'ホーム',
      messages: 'メッセージ',
      account: 'アカウント',
      send: '送信',
    },
    chat: {
      title: 'メッセージ',
      active: 'チャット中',
      waiting: 'ドライバーが配車を承認した後にチャットできます。',
      noHistory: 'この乗車にはまだチャット履歴がありません。',
      inputPlaceholder: 'メッセージを入力してください',
      loadFailed: 'チャット履歴を読み込めませんでした。',
      sendFailed: 'メッセージを送信できませんでした。',
    },
  },
  vi: {
    common: {
      home: 'Trang chủ',
      messages: 'Tin nhắn',
      account: 'Tài khoản',
      send: 'Gửi',
    },
    chat: {
      title: 'Tin nhắn',
      active: 'Đang chat',
      waiting: 'Chỉ có thể chat sau khi tài xế đã nhận chuyến.',
      noHistory: 'Chuyến này chưa có lịch sử chat.',
      inputPlaceholder: 'Nhập tin nhắn của bạn',
      loadFailed: 'Không tải được lịch sử chat.',
      sendFailed: 'Không gửi được tin nhắn.',
    },
  },
};

const LanguageContext = createContext(null);

function readPath(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredProfileLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'vi' ? 'vi' : 'ja';
  }, [language]);

  const value = useMemo(() => {
    const profile = profileText[language] || profileText.ja;
    const app = appText[language] || appText.ja;

    function setLanguage(nextLanguage) {
      setLanguageState(setStoredProfileLanguage(nextLanguage));
    }

    function t(path, fallback = '') {
      return readPath(app, path)
        ?? readPath(profile, path)
        ?? readPath(appText.ja, path)
        ?? readPath(profileText.ja, path)
        ?? fallback;
    }

    return {
      common: profile.common,
      language,
      languageOptions,
      profileText: profile,
      setLanguage,
      t,
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
