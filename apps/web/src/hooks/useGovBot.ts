import { useState, useCallback } from 'react';
import { proceduresApi } from '@/lib/api-client';

export type BotMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  sources?: {
    content: string;
    relevanceScore: number;
    title: string;
    article: string;
    url: string;
  }[];
  procedureCode?: string;
  isActionable?: boolean;
};

export function useGovBot() {
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Xin chào! Tôi là trợ lý ảo GovTrust AI. Bạn cần tư vấn hay hỗ trợ nộp hồ sơ thủ tục hành chính nào hôm nay?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProcedureCode, setCurrentProcedureCode] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsgId = Date.now().toString();
      const userMsg: BotMessage = { id: userMsgId, role: 'user', text };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        if (currentProcedureCode) {
          // If we are already in a procedure context, consult the RAG bot directly
          const res = await proceduresApi.consult(text, currentProcedureCode, 3) as any;
          const botMsg: BotMessage = {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            text: res.answer || 'Xin lỗi, tôi chưa tìm thấy thông tin phù hợp.',
            sources: res.sources,
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          // Identify the procedure first
          const res = await proceduresApi.identify(text) as any;
          if (res.procedureCode) {
            setCurrentProcedureCode(res.procedureCode);
            const botMsg: BotMessage = {
              id: (Date.now() + 1).toString(),
              role: 'bot',
              text: `Có phải bạn muốn thực hiện thủ tục **${res.procedureCode}**? Bạn có thể hỏi thêm các câu hỏi pháp lý về thủ tục này, hoặc bấm nút bên dưới để bắt đầu nộp hồ sơ trực tuyến.`,
              procedureCode: res.procedureCode,
              isActionable: true,
            };
            setMessages((prev) => [...prev, botMsg]);
          } else {
            // General fallback
            const botMsg: BotMessage = {
              id: (Date.now() + 1).toString(),
              role: 'bot',
              text: res.message || 'Xin lỗi, tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể nói rõ hơn được không?',
            };
            setMessages((prev) => [...prev, botMsg]);
          }
        }
      } catch (error: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            text: 'Xin lỗi, hệ thống AI đang bận hoặc mất kết nối. Vui lòng thử lại sau.',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [currentProcedureCode]
  );

  const resetContext = useCallback(() => {
    setCurrentProcedureCode(null);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'bot',
        text: 'Đã hủy ngữ cảnh thủ tục hiện tại. Bạn muốn hỏi về vấn đề gì khác?',
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    resetContext,
    currentProcedureCode,
  };
}
