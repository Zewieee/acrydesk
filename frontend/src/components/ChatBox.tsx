import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { getMessagesAPI, sendMessageAPI, type Message } from '../api/message';

interface ChatBoxProps {
  requestId: string;
}

export default function ChatBox({ requestId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = user?.id || user?._id;

  const fetchMessages = async () => {
    try {
      const data = await getMessagesAPI(requestId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));
    
    // Short polling
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  useEffect(() => {
    // Auto scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const sentMessage = await sendMessageAPI(requestId, newMessage);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] border border-slate-200 rounded-2xl overflow-hidden bg-white mt-4">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-slate-800 flex items-center justify-between">
        <span>Trao đổi trực tiếp</span>
        {isLoading && messages.length === 0 && <Loader2 size={16} className="animate-spin text-slate-400" />}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && !isLoading ? (
          <div className="text-center text-slate-400 h-full flex items-center justify-center text-sm">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId._id === currentUserId;
            
            return (
              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-1 px-1">
                    {msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                      isMine 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="p-2 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
