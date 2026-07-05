'use client';

import { useEffect } from 'react';

// VNPT SmartBot livechat widget (client-side embed).
// appCode là định danh public của bot (vốn ship xuống browser), không phải secret.
const APP_CODE = '65bab2c0-754a-11f1-8941-c3088749ded0';
const BASE_URL = 'https://livechat.vnpt.vn';
const SCRIPT_ID = 'vnpt_ai_livechat_script';

declare global {
  interface Window {
    vnpt_ai_render_chatbox?: (config: unknown, baseUrl: string, socket: string) => void;
    // Toggle panel chat — do vendor script khai báo global; dùng làm fallback.
    vnpt_ai_livechat_button_click?: () => void;
  }
}

// ID nút nổi vendor render (bản thường + bản dynamic).
const FLOAT_BTN_IDS = ['vnpt_ai_livechat_button', 'vnpt_ai_livechat_button_dynamic'];

/**
 * Mở panel VNPT SmartBot từ bất kỳ đâu (vd nút "Hỏi AI" ở hero).
 * Click thẳng nút nổi thật của vendor → chạy đúng handler gốc (đủ state closure).
 * Gọi hàm nội bộ trực tiếp không an toàn: nếu bot chưa render xong nó ném lỗi
 * (getElementById trả null). Widget tải bất đồng bộ nên retry vài nhịp.
 */
export function openVnptSmartBot(): void {
  if (typeof window === 'undefined') return;

  const tryOpen = (attempt: number): void => {
    const btn = FLOAT_BTN_IDS.map((id) => document.getElementById(id)).find(Boolean);
    if (btn) {
      (btn as HTMLElement).click();
      return;
    }
    // Fallback: gọi hàm global nếu nút chưa gắn nhưng hàm đã có.
    if (typeof window.vnpt_ai_livechat_button_click === 'function') {
      try {
        window.vnpt_ai_livechat_button_click();
        return;
      } catch {
        /* bot chưa render xong → thử lại bên dưới */
      }
    }
    if (attempt < 20) setTimeout(() => tryOpen(attempt + 1), 300); // tối đa ~6s
  };

  tryOpen(0);
}

function createSenderId(): string {
  try {
    const existing = localStorage.getItem('sb_sender_name');
    if (existing) return existing;
  } catch {
    /* localStorage không khả dụng → tạo mới mỗi lần */
  }

  let dt = Date.now();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

  try {
    localStorage.setItem('sb_sender_name', uuid);
  } catch {
    /* bỏ qua nếu không ghi được */
  }
  return uuid;
}

export function VnptSmartBot() {
  useEffect(() => {
    // Tránh nhúng trùng khi điều hướng client-side.
    if (document.getElementById(SCRIPT_ID)) return;

    const config = {
      appCode: APP_CODE,
      themes: '',
      appName: { line1: 'GovTrust AI', line2: 'Trợ lý dịch vụ công' },
      thumb: '',
      icon_bot:
        'https://ic-storage.vnpt.vn/smartbot-v2/chatbot_images/752023/9f5eb99b-8d14-4d8e-9f90-a0037ff62833.png',
      senderName: createSenderId(),
      isTyping: true,
      timeTyping: 1000,
      colorIcon: {
        colorVoteIcon: '#3CA46F',
        colorFrom: '#3CA46F',
        colorTo: '#3CA46F',
        colorSend: '#3CA46F',
        colorMic: '#3CA46F',
      },
      isVoting: true,
      styles: {
        head: {
          bgColor: '#3CA46F',
          text: {
            line: 1,
            line1: { color: '#fff', fontSize: '20px', fontWeight: 400 },
            line2: { color: '#fff', fontSize: '16px', fontWeight: 400 },
          },
        },
        border: {},
        floatButton: {
          bgColor: '#fff',
          icon: 'https://ic-storage.vnpt.vn/public-files/smartbot/Chatbot.png',
          width: '62',
          height: '62',
          img: { width: '51.6%' },
        },
        chat: {
          bg: '#F3F6F6',
          button: { bg: '#3CA46F', color: '#fff' },
          answer: { bg: '#EEEEEE', color: '#545454', fontSize: '12px' },
          question: { bg: '#3CA46F', color: '#fff', fontSize: '12px' },
          botIcon: 'https://storage-smartbot.vnpt.vn/public-files/smartbot/logo_bot_default.svg',
        },
      },
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `${BASE_URL}/vnpt_smartbot_stream_ver2.js`;

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${BASE_URL}/vnpt_smartbot_stream_ver2.css`;

    script.onload = () => {
      window.vnpt_ai_render_chatbox?.(config, BASE_URL, 'livechat.vnpt.ai:443');
    };

    document.body.appendChild(script);
    document.body.appendChild(stylesheet);
  }, []);

  return null;
}
