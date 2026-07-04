import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, RotateCcw, Mic, MicOff } from 'lucide-react';
import { useGovBot } from '@/hooks/useGovBot';
import { ChatMessage } from './ChatMessage';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { messages, isLoading, sendMessage, resetContext, currentProcedureCode } = useGovBot();

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current && recognitionRef.current.state !== 'inactive') {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListen = async () => {
    if (isListening) {
      if (recognitionRef.current && recognitionRef.current.state !== 'inactive') {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recognitionRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // Send to VNPT API
        try {
          const formData = new FormData();
          formData.append('audioFile', audioBlob);

          const res = await fetch('/api/smartvoice/stt', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'API Error');
          }
          const data = await res.json();
          if (data.transcript) {
            setInputValue((prev) => (prev ? prev + ' ' + data.transcript : data.transcript));
          }
        } catch (error) {
          console.error('STT failed:', error);
          alert('Không thể nhận diện giọng nói. Vui lòng thử lại!');
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('Microphone access denied or error:', err);
      alert(`Không thể truy cập Microphone. Lỗi: ${err.name || err.message || 'Không xác định'}. Vui lòng kiểm tra lại thiết bị thu âm hoặc cài đặt Windows.`);
    }
  };

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    sendMessage(inputValue);
    setInputValue('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors hover:scale-105 active:scale-95"
          >
            <MessageSquare size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col w-[420px] h-[650px] max-h-[85vh] bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  GovTrust Bot
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                </h3>
                <p className="text-emerald-100 text-xs">Trợ lý ảo pháp lý & thủ tục</p>
              </div>
              <div className="flex items-center gap-2">
                {currentProcedureCode && (
                  <button
                    onClick={resetContext}
                    title="Hủy ngữ cảnh thủ tục hiện tại"
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                <button
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Context Banner */}
            {currentProcedureCode && (
              <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-700">
                  Đang tư vấn thủ tục: <strong>{currentProcedureCode}</strong>
                </span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 flex flex-col gap-1">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                    <span className="flex gap-1">
                      <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`flex-shrink-0 p-3 rounded-full transition-all flex items-center justify-center border
                    ${isListening 
                      ? 'bg-red-50 text-red-500 border-red-200 animate-pulse' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
                  title={isListening ? 'Đang thu âm (Bấm để dừng)' : 'Nói bằng giọng nói'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={isListening ? "Đang nghe..." : "Nhập câu hỏi của bạn..."}
                    className={`w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all ${isListening ? 'placeholder:text-red-400 text-red-500' : 'placeholder:text-gray-400'}`}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors flex items-center justify-center"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
