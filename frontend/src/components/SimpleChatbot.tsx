import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, ChevronRight, Phone, Mail } from 'lucide-react';
import { chatWithAI_API } from '../api/ai';

export default function SimpleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ type: 'bot' | 'user'; text: string; options?: string[] }[]>([
    { 
      type: 'bot', 
      text: 'Xin chào! Tôi là trợ lý ảo AI của OPEP. Tôi có thể giúp gì cho bạn hôm nay?',
      options: ['Tìm hiểu sản phẩm', 'Yêu cầu báo giá', 'Liên hệ tư vấn']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const newUserMsg = { type: 'user' as const, text };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Call AI API
      const history = messages.map(m => ({ type: m.type, text: m.text }));
      const res = await chatWithAI_API(text, history);
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: res.response,
        options: res.response.length < 100 ? ['Tìm hiểu sản phẩm', 'Báo giá ngay'] : [] 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Xin lỗi, tôi đang gặp một chút vấn đề về kết nối. Bạn vui lòng thử lại sau hoặc gọi Hotline 0913 213 091 nhé!' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = (option: string) => {
    handleSend(option);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-black text-white rotate-90' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[550px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-10 fade-in duration-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Bot size={28} />
              </div>
              <div>
                <h4 className="font-bold text-lg tracking-tight">OPEP Assistant</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-100">Đang trực tuyến</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.type === 'bot' ? 'bg-blue-100 text-blue-600' : 'bg-slate-900 text-white'
                  }`}>
                    {msg.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.type === 'bot'
                      ? 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-100 rounded-tr-none'
                  }`}>
                    {msg.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Options (only for bot) */}
                {msg.type === 'bot' && msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-10">
                    {msg.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(opt)}
                        className="text-xs font-bold py-2 px-4 bg-white border border-blue-100 text-blue-600 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm flex items-center gap-1"
                      >
                        {opt} <ChevronRight size={12} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contact Info */}
          <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-between">
            <a href="tel:0913213091" className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">
              <Phone size={14} className="text-blue-600" /> Gọi ngay
            </a>
            <a href="mailto:opepvn1@gmail.com" className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">
              <Mail size={14} className="text-blue-600" /> Gửi Email
            </a>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
              className="relative"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
