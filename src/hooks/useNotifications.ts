import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    action_url?: string;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState<Socket | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!user || !supabase) return;
        
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (error) throw error;
            
            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();

        // Socket setup
        const newSocket = io();
        setSocket(newSocket);
        
        if (user) {
            newSocket.emit("join_user_room", user.id);
        }

        newSocket.on("new_notification", (notification: AppNotification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Browser Push Notification
            if (Notification.permission === "granted") {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico'
                });
            }
        });

        // Supabase Realtime fallback
        let channel: any;
        if (supabase && user) {
             channel = supabase.channel(`public:notifications:user_id=eq.${user.id}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
                    const newNotification = payload.new as AppNotification;
                    // Check if already got via socket to prevent duplicate
                    setNotifications(prev => {
                        if (prev.find(n => n.id === newNotification.id)) return prev;
                        
                        setUnreadCount(c => c + 1);
                        
                        // Browser Push Notification
                        if (Notification.permission === "granted") {
                            new Notification(newNotification.title, {
                                body: newNotification.message,
                                icon: '/favicon.ico' // fallback
                            });
                        }
                        
                        return [newNotification, ...prev];
                    });
                })
                .subscribe();
        }

        return () => {
            newSocket.disconnect();
            if (channel && supabase) {
                supabase.removeChannel(channel);
            }
        };
    }, [user, fetchNotifications]);

    const markAsRead = async (id: string) => {
        if (!supabase) return;
        try {
             // optimistic
             setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
             setUnreadCount(prev => Math.max(0, prev - 1));
             
             await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        } catch (err) {
             console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        if (!user || !supabase) return;
        try {
            // optimistic
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            
            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const requestPermission = async () => {
        if (!("Notification" in window)) return false;
        if (Notification.permission === "granted") return true;
        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        return false;
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        requestPermission
    };
}
