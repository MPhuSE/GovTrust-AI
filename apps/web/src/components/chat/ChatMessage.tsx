import React, { useState } from 'react';
import { BotMessage } from '@/hooks/useGovBot';
import { Bot, User, FileText, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

interface ChatMessageProps {
  message: BotMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async () => {
    if (isPlaying) {
      // If currently playing, we'd ideally stop it. For simplicity, we just toggle state.
      // In a real app, we'd keep a ref to the Audio object and call audio.pause().
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      // Clean markdown before speaking
      const textToSpeak = message.text.replace(/[*_#`]/g, '');
      
      const res = await fetch('/api/smartvoice/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSpeak }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TTS API Error');

      if (data.audio_link) {
        const audio = new Audio(data.audio_link);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        audio.play();
      } else {
        throw new Error('Không tìm thấy audio_link');
      }
    } catch (error: any) {
      console.error('TTS failed:', error);
      setIsPlaying(false);
      alert(`Không thể tải giọng nói. Lỗi: ${error.message}`);
    }
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm relative
          ${isUser ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-emerald-600'}`}
        >
          {isUser ? <User size={16} /> : <Bot size={18} />}
          {!isUser && (
            <button
              onClick={handleSpeak}
              className={`absolute -top-3 -right-3 p-1 rounded-full bg-white shadow-md border border-gray-100 transition-colors
              ${isPlaying ? 'text-emerald-600 animate-pulse' : 'text-gray-400 hover:text-emerald-500'}`}
              title="Đọc văn bản"
            >
              {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-3 rounded-2xl text-[15px] shadow-sm min-w-0 break-words
          ${
            isUser
              ? 'bg-emerald-600 text-white rounded-br-none'
              : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <div
            className="prose prose-sm prose-p:leading-relaxed max-w-none break-words"
            dangerouslySetInnerHTML={{
              __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
            }}
          />

          {/* Render Action Buttons for intent identification */}
          {message.isActionable && message.procedureCode && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    const { sessionsApi } = await import('@/lib/api-client');
                    const session = (await sessionsApi.create(message.procedureCode!)) as any;
                    window.location.href = `/upload/${session._id}`;
                  } catch (e) {
                    console.error('Failed to create session', e);
                  }
                }}
                className="flex items-center justify-between px-3 py-2 text-sm bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors w-full text-left"
              >
                <span>Nộp hồ sơ ngay</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}


          {/* Render Legal Sources (RAG) */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100/50 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Căn cứ pháp lý</p>
              {message.sources.map((src, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-2.5 border border-gray-200/60">
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 break-words">
                        {src.article}, {src.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-4 break-words" title={src.content}>
                        "{src.content}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
