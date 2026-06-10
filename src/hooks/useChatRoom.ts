import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
    file_url?: string;
    file_type?: string;
    read_by?: string[];
}

export function useChatRoom(roomId: string | null) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (!roomId || !supabase || !user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id, 
                    content, 
                    created_at, 
                    sender_id,
                    sender:users!messages_sender_id_fkey(full_name),
                    attachments(file_url, file_type),
                    message_reads(user_id)
                `)
                .eq('room_id', roomId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (data) {
                const formatted = data.map((m: any) => ({
                    id: m.id,
                    sender_id: m.sender_id,
                    sender_name: m.sender?.full_name || 'Unknown',
                    content: m.content,
                    created_at: m.created_at,
                    file_url: m.attachments?.[0]?.file_url,
                    file_type: m.attachments?.[0]?.file_type,
                    read_by: m.message_reads?.map((r: any) => r.user_id) || []
                }));
                setMessages(formatted);
            }
        } catch (err) {
            console.error("Error fetching messages", err);
        } finally {
            setLoading(false);
        }
    }, [roomId, user]);

    useEffect(() => {
        fetchMessages();
        
        if (!roomId || !supabase) return;
        // Realtime
        const channel = supabase.channel(`public:messages:room_id=eq.${roomId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, payload => {
                // Actually socket.io handles realtime for us in UI, but this is good fallback
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMessages, roomId]);

    const sendMessage = async (text: string, fileUrl?: string, fileType?: string) => {
        if (!roomId || !supabase || !user || (!text && !fileUrl)) return null;

        try {
            const tempId = Date.now().toString();
            const newMsg: ChatMessage = {
                id: tempId,
                sender_id: user.id,
                sender_name: user.full_name || 'You',
                content: text,
                created_at: new Date().toISOString(),
                file_url: fileUrl,
                file_type: fileType,
                read_by: []
            };

            // return pessimistic DB insertion instead
            const { data: insertedMsg, error: msgErr } = await supabase.from('messages').insert({
                room_id: roomId,
                sender_id: user.id,
                content: text
            }).select().single();
            
            if (msgErr) throw msgErr;

            if (fileUrl && insertedMsg) {
                await supabase.from('attachments').insert({
                    uploader_id: user.id,
                    message_id: insertedMsg.id,
                    file_url: fileUrl,
                    file_type: fileType
                });
            }
            return newMsg;
        } catch (err) {
            console.error("Error sending", err);
            return null;
        }
    };

    const markAsRead = async (messageIds: string[]) => {
         if (!supabase || !user || messageIds.length === 0) return;
         try {
             // Only insert if not already read
             const payload = messageIds.map(id => ({ message_id: id, user_id: user.id }));
             const { error } = await supabase.from('message_reads').upsert(payload, { onConflict: 'message_id,user_id' });
             if (error) throw error;
             
             // Optimistically update local array
             setMessages(prev => prev.map(m => messageIds.includes(m.id) ? { ...m, read_by: [...(m.read_by || []), user.id] } : m));
         } catch (err) {
             console.error("Mark read error", err);
         }
    };

    return { messages, setMessages, loading, sendMessage, markAsRead };
}
