import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, BellRing } from 'lucide-react';
import { useNotifications, AppNotification } from '../hooks/useNotifications';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, requestPermission } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-400 hover:text-white transition-colors relative p-2"
            >
                {unreadCount > 0 ? (
                    <BellRing size={20} className="animate-pulse text-blue-400" />
                ) : (
                    <Bell size={20} />
                )}
                
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[85vh] sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-widest font-bold flex items-center gap-1 transition-colors"
                            >
                                <Check size={12} /> Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-y-auto max-h-[400px]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                <Bell className="mx-auto mb-2 opacity-20" size={32} />
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-slate-800/50">
                                {notifications.map(notification => (
                                    <div 
                                        key={notification.id} 
                                        className={`p-4 transition-colors ${notification.is_read ? 'bg-transparent hover:bg-slate-800/30' : 'bg-blue-900/10 hover:bg-blue-900/20'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!notification.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-200 mb-0.5">{notification.title}</h4>
                                                <p className="text-sm text-slate-400 leading-relaxed mb-2">{notification.message}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                    </span>
                                                    {notification.action_url && (
                                                        <Link 
                                                            to={notification.action_url}
                                                            onClick={() => handleNotificationClick(notification)}
                                                            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold tracking-wider uppercase bg-blue-500/10 px-2 py-1 rounded"
                                                        >
                                                            View
                                                        </Link>
                                                    )}
                                                    {!notification.action_url && !notification.is_read && (
                                                        <button 
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="text-[10px] text-slate-500 hover:text-slate-300 font-bold tracking-wider uppercase"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
