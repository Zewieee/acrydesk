import { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Loader2, MessageSquare, Search, Info, Paperclip, X, FileIcon, Image as ImageIcon } from 'lucide-react';
import { getMessagesAPI, sendMessageAPI, type Message } from '../api/message';
import { uploadFilesAPI } from '../api/upload';
import { type RFQ } from '../types/rfq';
import { io, Socket } from 'socket.io-client';

interface MessagesViewProps {
  rfqs: RFQ[];
  defaultSelectedId?: string | null;
  onMessageSent?: () => void;
}

export default function MessagesView({ rfqs, defaultSelectedId, onMessageSent }: MessagesViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);


  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = user?.id || user?._id;

  const selectedRFQ = useMemo(() => rfqs.find(r => r.id === selectedId), [rfqs, selectedId]);

  const filteredRFQs = useMemo(() => {
    return rfqs.filter(r => 
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items?.some(i => i.productType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [rfqs, searchTerm]);

  const fetchMessages = async (id: string) => {
    try {
      const data = await getMessagesAPI(id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  useEffect(() => {
    // 1. Initialize socket connection
    const newSocket = io('http://localhost:3000', {
       withCredentials: true
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (selectedId && socket) {
      setIsLoading(true);
      fetchMessages(selectedId).finally(() => setIsLoading(false));
      
      socket.emit('joinRoom', selectedId);

      const handleNewMessage = (msg: Message) => {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.emit('leaveRoom', selectedId);
        socket.off('new_message', handleNewMessage);
      };
    } else {
      setMessages([]);
    }
  }, [selectedId, socket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && pendingFiles.length === 0) || isSending || isUploading || !selectedId) return;

    setIsSending(true);
    try {
      let attachments: any[] = [];
      
      // 1. Upload files first if any
      if (pendingFiles.length > 0) {
        setIsUploading(true);
        const uploadResult = await uploadFilesAPI(pendingFiles);
        // uploadResult is { urls: string[] }
        attachments = uploadResult.urls.map((url: string, index: number) => ({
          url,
          name: pendingFiles[index].name,
          type: pendingFiles[index].type
        }));
        setIsUploading(false);
      }

      // 2. Send message with attachments
      const sentMessage = await sendMessageAPI(selectedId, newMessage, attachments);
      setMessages(prev => {
        if (prev.find(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
      setNewMessage('');
      setPendingFiles([]);
      if (onMessageSent) onMessageSent();
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPendingFiles(prev => [...prev, ...files]);
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i: number) => i !== index));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl h-[calc(100vh-140px)] flex overflow-hidden shadow-sm">
      {/* Sidebar: Danh sách chat */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Trao đổi</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm RFQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {filteredRFQs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">Không tìm thấy yêu cầu nào</div>
          ) : (
            filteredRFQs.map(rfq => (
              <button
                key={rfq.id}
                onClick={() => setSelectedId(rfq.id)}
                className={`w-full text-left p-4 border-b border-slate-100 transition truncate
                  ${selectedId === rfq.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-semibold text-sm ${selectedId === rfq.id ? 'text-blue-700' : 'text-slate-900'}`}>{rfq.code}</span>
                  <span className="text-[10px] text-slate-400">{new Date(rfq.updatedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="text-xs text-slate-600 truncate">
                   {rfq.items?.length ? (rfq.items.length > 1 ? `${rfq.items[0].productType} (+${rfq.items.length - 1})` : rfq.items[0].productType) : '—'}
                </div>
                <div className="text-xs text-slate-500 truncate mt-1">- {rfq.customerName}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedRFQ ? (
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {/* Chat Header */}
          <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {selectedRFQ.code}
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{selectedRFQ.status.toUpperCase()}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {selectedRFQ.items?.length ? (selectedRFQ.items.length > 1 ? `${selectedRFQ.items[0].productType} (+${selectedRFQ.items.length - 1})` : selectedRFQ.items[0].productType) : '—'} 
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 tooltip" title="Chi tiết trong danh sách RFQ">
              <Info size={18} />
            </div>
          </div>

          {/* Messages Wrapper */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p>Đang tải tin nhắn...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                <MessageSquare size={48} className="mb-4 text-slate-300" />
                <p>Chưa có tin nhắn nào.</p>
                <p className="text-sm">Hãy bắt đầu trao đổi chi tiết về đơn hàng này!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMine = msg.senderId._id === currentUserId;
                const showSender = index === 0 || messages[index - 1].senderId._id !== msg.senderId._id;
                
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                   {!isMine && showSender && (
                     <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 mr-3 mt-4">
                       {msg.senderId.name[0]?.toUpperCase()}
                     </div>
                   )}
                   {!isMine && !showSender && <div className="w-11 shrink-0" />}

                    <div className={`max-w-[75%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {showSender && (
                        <span className="text-[11px] text-slate-400 mb-1 px-1">
                          {isMine ? 'Bạn' : msg.senderId.name} • {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <div 
                        className={`px-5 py-3 text-sm shadow-sm ${
                          isMine 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        {msg.content}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className={`mt-2 flex flex-col gap-2 ${isMine ? 'items-end' : 'items-start'}`}>
                            {msg.attachments.map((file, i) => (
                              <div key={i} className="max-w-xs">
                                {file.type.startsWith('image/') ? (
                                  <a href={`http://localhost:3000${file.url}`} target="_blank" rel="noopener noreferrer">
                                    <img 
                                      src={`http://localhost:3000${file.url}`} 
                                      alt={file.name} 
                                      className="rounded-xl border border-slate-200/20 max-h-48 object-cover hover:opacity-90 transition"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    href={`http://localhost:3000${file.url}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition ${
                                      isMine ? 'bg-blue-700/50 hover:bg-blue-800' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                  >
                                    <FileIcon size={14} />
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            {/* Pending files list */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 px-2 max-w-4xl mx-auto">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative group shrink-0">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
                       {file.type.startsWith('image/') ? <ImageIcon size={16} className="text-blue-500" /> : <FileIcon size={16} className="text-slate-400" />}
                       <span className="text-xs text-slate-600 max-w-[100px] truncate">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => removePendingFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto items-center">
              <div className="flex gap-1">
                <button
                   type="button"
                   onClick={() => fileInputRef.current?.click()}
                   className="p-3 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition"
                   title="Gửi file/ảnh"
                >
                  <Paperclip size={20} />
                </button>
              </div>

              <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 multiple 
                 onChange={handleFileSelect} 
              />

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onFocus={() => {}}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-5 py-3.5 bg-slate-100 border-none rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                disabled={isSending || isUploading}
              />
              <button
                type="submit"
                disabled={(!newMessage.trim() && pendingFiles.length === 0) || isSending || isUploading}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-blue-600/30 shrink-0"
              >
                {isSending || isUploading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
          <MessageSquare size={64} className="mb-6 opacity-20" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">Trang thông tin trao đổi</h2>
          <p className="max-w-xs text-center text-sm">Chọn một yêu cầu bên trái để bắt đầu thảo luận</p>
        </div>
      )}
    </div>
  );
}
