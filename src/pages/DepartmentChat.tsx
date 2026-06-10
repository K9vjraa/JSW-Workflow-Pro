import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, FileText, Search, Check, CheckCheck, PlayCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useChatRoom, ChatMessage } from "../hooks/useChatRoom";

interface ChatRoomInfo {
    id: string;
    name: string;
    type: 'DEPARTMENT' | 'TASK';
    lastMessage?: string;
}

export default function DepartmentChat() {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchRooms = async () => {
            if (!supabase || !user) return;
            // Fetch department room
            const { data: deptData } = await supabase.from('chat_rooms')
                .select('id, department_id, departments(name)')
                .eq('type', 'DEPARTMENT')
                .eq('department_id', user.department_id)
                .single();
                
            const fetchedRooms: ChatRoomInfo[] = [];
            
            if (deptData) {
                fetchedRooms.push({
                    id: deptData.id,
                    name: `${(deptData.departments as any)?.name || 'Department'} General`,
                    type: 'DEPARTMENT'
                });
            } else if (user.department_id) {
                // Try create it
                const { data: newRoom } = await supabase.from('chat_rooms').insert({
                    type: 'DEPARTMENT',
                    department_id: user.department_id
                }).select('id').single();
                if (newRoom) {
                     fetchedRooms.push({
                        id: newRoom.id,
                        name: 'Department General',
                        type: 'DEPARTMENT'
                    });
                }
            }

            // Fetch task rooms the user belongs to
            const { data: taskRooms } = await supabase.from('chat_rooms')
                .select('id, task_id, tasks!inner(title, assignee_id, department_id)')
                .eq('type', 'TASK');
                
            if (taskRooms) {
                taskRooms.forEach((r: any) => {
                    // Only add if assigned to user or in same dept
                    if (r.tasks.assignee_id === user.id || r.tasks.department_id === user.department_id) {
                         fetchedRooms.push({
                             id: r.id,
                             name: `Task: ${r.tasks.title}`,
                             type: 'TASK'
                         });
                    }
                });
            }

            setRooms(fetchedRooms);
            if (fetchedRooms.length > 0) {
                setSelectedRoomId(fetchedRooms[0].id);
            }
        };
        fetchRooms();

        const newSocket = io();
        setSocket(newSocket);
        return () => {
             newSocket.disconnect();
        };
    }, [user]);

    const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-950 text-white">
            <div className="w-80 border-r border-slate-800 bg-black flex flex-col shrink-0 h-full">
                <div className="p-5 border-b border-slate-800">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Communications</h2>
                    <div className="mt-4 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search chats..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 text-sm placeholder-slate-600 indent-8 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-600 transition-colors" 
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredRooms.map(room => (
                        <div 
                            key={room.id}
                            onClick={() => setSelectedRoomId(room.id)}
                            className={`p-4 cursor-pointer hover:bg-slate-900/60 transition border-l-4 border-b border-slate-900 ${selectedRoomId === room.id ? 'bg-slate-900/60 border-l-blue-600' : 'border-l-transparent'}`}
                        >
                            <h3 className="text-sm font-bold text-white truncate">{room.name}</h3>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{room.type}</p>
                        </div>
                    ))}
                    {filteredRooms.length === 0 && (
                        <div className="p-5 text-center text-slate-500 text-sm">No chats found.</div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-slate-950/50">
               {selectedRoomId ? (
                   <ActiveRoom roomId={selectedRoomId} roomName={rooms.find(r => r.id === selectedRoomId)?.name || ''} socket={socket} />
               ) : (
                   <div className="flex-1 flex items-center justify-center text-slate-500">
                       Select a chat to start messaging
                   </div>
               )}
            </div>
        </div>
    );
}

function ActiveRoom({ roomId, roomName, socket }: { roomId: string, roomName: string, socket: Socket | null }) {
    const { user } = useAuth();
    const { messages, setMessages, sendMessage, markAsRead } = useChatRoom(roomId);
    const [inputText, setInputText] = useState("");
    const [uploading, setUploading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!roomId || !socket) return;
        const socketRoom = `room_${roomId}`;
        socket.emit("join_room", socketRoom);

        socket.on("receive_message", (data: ChatMessage) => {
            setMessages(prev => [...prev, data]);
             // Mark as read if not ours
             if (user && data.sender_id !== user.id) {
                markAsRead([data.id]);
                socket.emit("read_receipt", { room: socketRoom, messageId: data.id, userId: user.id });
             }
            scrollToBottom();
        });

        socket.on("typing", (data: { room: string, name: string }) => {
            setTypingUsers(prev => prev.includes(data.name) ? prev : [...prev, data.name]);
            scrollToBottom();
        });

        socket.on("stop_typing", (data: { room: string, name: string }) => {
            setTypingUsers(prev => prev.filter(n => n !== data.name));
        });
        
        socket.on("read_receipt", (data: { room: string, messageId: string, userId: string }) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, read_by: [...(m.read_by || []), data.userId] } : m));
        });

        return () => {
             socket.off("receive_message");
             socket.off("typing");
             socket.off("stop_typing");
             socket.off("read_receipt");
        };
    }, [roomId, socket, user, setMessages]);

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
            setMessages(prev => prev.map(m => m.id === tempId ? actualMsg : m));
        }
    };

    const handleFileUpload = async (type: 'IMAGE' | 'DOCUMENT' | 'VIDEO') => {
        setUploading(true);
        setTimeout(() => {
            let mockUrl = '';
            if (type === 'IMAGE') mockUrl = 'https://images.unsplash.com/photo-1541888087574-fc2a1cbab203?w=800';
            if (type === 'DOCUMENT') mockUrl = 'https://example.com/safety_guidelines.pdf';
            if (type === 'VIDEO') mockUrl = 'https://example.com/mock-video.mp4';
            
            handleSend({ preventDefault: () => {} } as React.FormEvent, mockUrl, type);
            setUploading(false);
        }, 1500);
    };
    
    // Simple Mention formatting parser
    const formatMessageText = (text: string) => {
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, i) => 
            part.startsWith('@') ? <span key={i} className="text-blue-400 font-medium bg-blue-900/30 px-1 rounded">{part}</span> : part
        );
    };

    return (
        <>
            <header className="p-5 border-b border-slate-800 bg-black/50 flex items-center justify-between shadow-sm z-10 shrink-0">
                <div>
                    <h2 className="text-sm font-bold text-white tracking-wider">{roomName}</h2>
                    {typingUsers.length > 0 ? (
                        <p className="text-xs text-blue-400 italic mt-1">{typingUsers.join(', ')} typing...</p>
                    ) : (
                        <p className="text-xs text-green-500 font-bold mt-1 tracking-widest uppercase">● Connection Active</p>
                    )}
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="text-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 bg-slate-800 text-slate-400 rounded-full">
                        Chat History
                    </span>
                </div>
                
                {messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    const isRead = msg.read_by && msg.read_by.length > 0;
                    
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : ''}`}>
                            <div className={`max-w-[70%] ${isMe ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl shadow-lg shadow-blue-900/20' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-r-xl rounded-tl-xl'} p-3 shadow-sm`}>
                                {!isMe && (
                                    <p className="text-[10px] font-bold text-blue-400 mb-1">{msg.sender_name}</p>
                                )}
                                
                                {msg.file_url && msg.file_type === 'IMAGE' && (
                                    <img src={msg.file_url} alt="Shared attachment" className="w-full max-h-64 object-cover rounded-lg mb-2 border border-black/20" />
                                )}
                                
                                {msg.file_url && msg.file_type === 'VIDEO' && (
                                    <div className="w-full h-48 bg-black/40 rounded-lg mb-2 flex items-center justify-center border border-black/20 relative cursor-pointer group">
                                         <PlayCircle size={48} className="text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                                         <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 px-2 py-0.5 rounded">Video Attachment</div>
                                    </div>
                                )}
                                
                                {msg.file_url && msg.file_type === 'DOCUMENT' && (
                                    <div className={`p-3 rounded-lg flex items-center gap-3 mb-2 text-sm border ${isMe ? 'bg-blue-700/50 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                        <FileText size={20} className={isMe ? 'text-blue-200' : 'text-slate-400'} />
                                        <span className="truncate flex-1 font-medium">Document Attachment</span>
                                    </div>
                                )}
                                
                                {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{formatMessageText(msg.content)}</p>}
                                
                                <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'justify-end text-blue-200' : 'text-slate-500'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                    {isMe && (isRead ? <CheckCheck size={12} className="text-white" /> : <Check size={12} />)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-800 bg-black/50">
                <form onSubmit={handleSend} className="flex items-end gap-2">
                    <div className="flex gap-1 mb-2">
                        <button type="button" onClick={() => handleFileUpload('IMAGE')} disabled={uploading} className="p-2 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50">
                            <ImageIcon size={20} className={uploading ? "animate-pulse font-bold text-blue-500" : ""} />
                        </button>
                        <button type="button" onClick={() => handleFileUpload('VIDEO')} disabled={uploading} className="p-2 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50">
                            <PlayCircle size={20} />
                        </button>
                        <button type="button" onClick={() => handleFileUpload('DOCUMENT')} disabled={uploading} className="p-2 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50">
                            <FileText size={20} />
                        </button>
                    </div>
                    <div className="flex-1 border border-slate-700 rounded-lg bg-slate-900 focus-within:ring-1 focus-within:ring-blue-500 transition overflow-hidden flex items-center">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={handleTyping}
                            placeholder="Type a message... (Use @ to mention)"
                            className="w-full bg-transparent px-4 py-3 outline-none text-white text-sm placeholder-slate-600"
                        />
                        <button type="submit" disabled={!inputText.trim() || uploading} className="p-3 text-blue-500 disabled:text-slate-600 hover:bg-slate-800 transition-colors">
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
