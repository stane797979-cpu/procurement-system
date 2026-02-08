import { ChatInterface } from '@/components/ai/chat-interface';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 채팅 | FloStok',
  description: 'AI 어시스턴트와 재고 관리 및 발주에 대해 상담하세요',
};

/**
 * AI 채팅 페이지
 */
export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight">AI 어시스턴트</h1>
          <p className="text-sm text-muted-foreground">
            재고 관리, 발주 추천, 수요 예측 등에 대해 질문하세요
          </p>
        </div>
      </div>
      <ChatInterface />
    </div>
  );
}
