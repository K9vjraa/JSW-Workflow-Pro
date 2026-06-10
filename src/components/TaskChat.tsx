import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useChatRoom, ChatMessage } from "../hooks/useChatRoom";

interface TaskChatProps {
    taskId: string;
}

export default function TaskChat({ taskId }: TaskChatProps) {
    const { user } = useAuth();
    const [roomId, setRoomId] = useState<string | null>(null);
    const { messages, setMessages, sendMessage, markAsRead } = useChatRoom(roomId);
    
    const [inputText, setInputText] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const initRoom = async () => {
            if (!supabase) return;
            // Get or create task chat room
            let { data: room, error } = await supabase.from('chat_rooms').select('id').eq('type', 'TASK').eq('task_id', taskId).single();
            
            if (error || !room) {
               const { data: inserted, error: insertErr } = await supabase.from('chat_rooms').insert({
                   type: 'TASK',
                   task_id: taskId
               }).select('id').single();
               
               if (inserted) {
                   setRoomId(inserted.id);
               }
            } else {
               setRoomId(room.id);
            }
        };
        initRoom();
    }, [taskId]);

    useEffect(() => {
        if (!roomId) return;
        const newSocket = io();
        setSocket(newSocket);
        
        const socketRoom = `room_${roomId}`;
        newSocket.emit("join_room", socketRoom);
        
        newSocket.on("receive_message", (data: ChatMessage) => {
            setMessages(prev => [...prev, data]);
            scrollToBottom();
            
            // Mark as read if not ours
            if (user && data.sender_id !== user.id) {
                markAsRead([data.id]);
                newSocket.emit("read_receipt", { room: socketRoom, messageId: data.id, userId: user.id });
            }
        });

        newSocket.on("typing", (data: { room: string, name: string }) => {
            setTypingUsers(prev => prev.includes(data.name) ? prev : [...prev, data.name]);
            scrollToBottom();
        });

        newSocket.on("stop_typing", (data: { room: string, name: string }) => {
            setTypingUsers(prev => prev.filter(n => n !== data.name));
        });

        newSocket.on("read_receipt", (data: { room: string, messageId: string, userId: string }) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, read_by: [...(m.read_by || []), data.userId] } : m));
        });

        return () => {
            newSocket.disconnect();
        };
    }, [roomId, user, setMessages]);
    
    // Auto mark all unread as read on load
    useEffect(() => {
        if (messages.length > 0 && user) {
            const unreadIds = messages.filter(m => m.sender_id !== user.id && !(m.read_by || []).includes(user.id)).map(m => m.id);
            if (unreadIds.length > 0) {
                 markAsRead(unreadIds);
                 if (socket && roomId) {
                     unreadIds.forEach(id => {
                         socket.emit("read_receipt", { room: `room_${roomId}`, messageId: id, userId: user.id });
                     });
                 }
            }
            scrollToBottom();
        }
    }, [messages.length, user]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (!socket || !user || !roomId) return;
        
        socket.emit("typing", { room: `room_${roomId}`, name: user.full_name || user.email });
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stop_typing", { room: `room_${roomId}`, name: user.full_name || user.email });
        }, 2000);
    };

    const handleSend = async (e: React.FormEvent, fileUrl?: string, fileType?: string) => {
        e.preventDefault();
        const text = inputText.trim();
        if ((!text && !fileUrl) || !user || !roomId) return;
        
        // Optimistic UI for text
        const tempId = Date.now().toString();
        const optimisticMsg: ChatMessage = {
            id: tempId,
            sender_id: user.id,
            sender_name: user.full_name || 'You',
            content: text,
            created_at: new Date().toISOString(),
            file_url: fileUrl,
            file_type: fileType,
            read_by: []
        };
        
        setMessages(prev => [...prev, optimisticMsg]);
        setInputText("");
        scrollToBottom();

        if (socket) {
            socket.emit("stop_typing", { room: `room_${roomId}`, name: user.full_name || user.email });
        }

        const actualMsg = await sendMessage(text, fileUrl, fileType);
        if (actualMsg && socket) {
            socket.emit("send_message", { room: `room_${roomId}`, ...actualMsg });
            // replace optimistic with actual to get real ID
            setMessages(prev => prev.map(m => m.id === tempId ? actualMsg : m));
        }
    };

    const handleFileUpload = async (type: 'IMAGE' | 'DOCUMENT') => {
        setUploading(true);
        setTimeout(() => {
            const mockUrl = type === 'IMAGE' 
                ? 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'
                : 'https://example.com/mock-doc.pdf';
            handleSend({ preventDefault: () => {} } as React.FormEvent, mockUrl, type);
            setUploading(false);
        }, 1000);
    };

    if (!roomId && supabase) {
        return <div className="w-full lg:w-1/3 min-w-[350px] bg-black border-l border-slate-800 flex items-center justify-center text-slate-500 text-sm">Joining task chat...</div>;
    }

    return (
        <div className="w-full lg:w-1/3 min-w-[350px] bg-black border-l border-slate-800 flex flex-col shrink-0 h-full">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Task Discussion</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Realtime Chat
                </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    const isRead = msg.read_by && msg.read_by.length > 0;
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : ''}`}>
                            <div className={`max-w-[85%] ${isMe ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-r-xl rounded-tl-xl'} p-3 shadow-sm`}>
                                {!isMe && (
                                    <p className="text-[10px] font-bold text-blue-400 mb-1">{msg.sender_name}</p>
                                )}
                                
                                {msg.file_url && msg.file_type === 'IMAGE' && (
                                    <img src={msg.file_url} alt="Shared attachment" className="w-full object-cover rounded-lg mb-2 border border-black/20" />
                                )}
                                
                                {msg.file_url && msg.file_type !== 'IMAGE' && (
                                    <div className="p-2 bg-black/20 rounded-lg flex items-center gap-2 mb-2 text-sm">
                                        <Paperclip size={14} /> File Attachment
                                    </div>
                                )}
                                
                                {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}
                                
                                <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'justify-end text-blue-200' : 'text-slate-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                    {isMe && (isRead ? <CheckCheck size={12} className="text-white" /> : <Check size={12} />)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-4 py-2 text-xs italic shadow-sm flex items-center gap-2">
                            <span className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                            </span>
                            {typingUsers.join(', ')} typing...
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800 bg-black/50">
                <form onSubmit={e => handleSend(e)} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <button type="button" onClick={() => handleFileUpload('IMAGE')} className="text-slate-500 hover:text-white transition-colors" disabled={uploading}>
                        <ImageIcon size={18} className={uploading ? "animate-pulse text-blue-400" : ""} />
                    </button>
                    <button type="button" onClick={() => handleFileUpload('DOCUMENT')} className="text-slate-500 hover:text-white transition-colors" disabled={uploading}>
                        <Paperclip size={18} />
                    </button>
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={handleTyping}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 h-9 px-2"
                        placeholder="Type a message..."
                    />
                    <button type="submit" disabled={(!inputText.trim() && !uploading) || uploading} className="text-blue-500 hover:text-blue-400 disabled:text-slate-600 transition-colors">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
