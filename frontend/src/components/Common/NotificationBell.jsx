import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { getToken } from '../../utils/auth';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.isSeen).length;

    const fetchNotifications = async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await api.get('/api/notifications', {
                headers: { Authorization: 'Bearer ' + token }
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const markAllAsSeen = async () => {
        try {
            await api.put('/api/notifications/seen', {}, {
                headers: { Authorization: 'Bearer ' + getToken() }
            });
            // Update local state to reflect seen status
            setNotifications(prev => prev.map(n => ({ ...n, isSeen: true })));
        } catch (err) {
            console.error('Failed to mark as seen', err);
        }
    };

    const socket = useSocket();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); 
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            markAllAsSeen();
        }
    }, [isOpen, unreadCount]);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_notification', (notif) => {
            console.log('New notification received via socket:', notif);
            setNotifications(prev => [notif, ...prev]);
            
            // Play notification sound
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio play failed:', e));
            } catch (e) {
                console.error('Audio error:', e);
            }

            // Optional: Show a browser notification or sound
            if (Notification.permission === "granted") {
                new Notification(notif.message);
            }
        });

        return () => {
            socket.off('new_notification');
        };
    }, [socket]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notif) => {
        setIsOpen(false);
        try {
            await api.put(`/api/notifications/${notif._id}/read`, {}, {
                headers: { Authorization: 'Bearer ' + getToken() }
            });
            // Update local state - mark as both read AND seen
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true, isSeen: true } : n));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }

        // Navigate based on type
        if (notif.type === 'new_food') {
            navigate('/foods');
        } else if (notif.type === 'new_request') {
            navigate('/provider', { state: { activeTab: 'requests' } });
        } else {
            navigate('/ngo');
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all relative"
                aria-label="Notifications"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 px-1 min-w-[14px] h-[14px] bg-rose-500 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-x-4 top-[70px] md:absolute md:inset-auto md:right-0 md:mt-2 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fadeIn"
                >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Notifications</h3>
                        {unreadCount > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{unreadCount} New</span>}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 italic text-sm">No notifications yet</div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n._id} 
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            n.type === 'new_food' ? 'bg-emerald-100 text-emerald-600' : 
                                            n.type === 'new_request' ? 'bg-indigo-100 text-indigo-600' :
                                            'bg-blue-100 text-blue-600'}`}>
                                            {n.type === 'new_food' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            ) : n.type === 'new_request' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{n.message}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{formatTime(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
