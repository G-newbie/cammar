import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../Welcome_Page/logo.png';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../lib/api';

function Navbar() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);

    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const res = await getUnreadNotificationCount();
                if (res.res_code === 200) {
                    setUnreadCount(res.unread_count || 0);
                }
            } catch (e) {
                console.error('Error loading unread count:', e);
            }
        };
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (showNotifications) {
            loadNotifications();
        }
    }, [showNotifications]);

    const loadNotifications = async () => {
        setNotificationsLoading(true);
        try {
            const res = await getNotifications({ limit: 20 });
            if (res.res_code === 200) {
                setNotifications(res.notifications || []);
                setUnreadCount(res.unread_count || 0);
            }
        } catch (e) {
            console.error('Error loading notifications:', e);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId, e) => {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        try {
            const res = await markNotificationAsRead(notificationId);
            if (res.res_code === 200) {
                setNotifications(prev => prev.map(n => 
                    n.id === notificationId ? { ...n, is_read: true } : n
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async (e) => {
        e.stopPropagation();
        try {
            const res = await markAllNotificationsAsRead();
            if (res.res_code === 200) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (e) {
            console.error('Error marking all as read:', e);
        }
    };

    const handleDelete = async (notificationId, e) => {
        e.stopPropagation();
        try {
            const res = await deleteNotification(notificationId);
            if (res.res_code === 200) {
                const deleted = notifications.find(n => n.id === notificationId);
                if (deleted && !deleted.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            }
        } catch (e) {
            console.error('Error deleting notification:', e);
        }
    };

    return (
        <nav className="navbar navbar-expand-md">
            <div className="container-fluid">
                <div className="navbar-header navbarLogoCtn">
                    <Link className='nav-link' to='/home'>
                        <img src={logo} className="navbar-brand navbarLogo"></img>
                    </Link>
                </div>
                <ul className="navbar-nav navCtn">
                    <li className="nav-item navCommunity">
                        <Link className='nav-link' to='/community'>Community</Link>
                    </li>
                    <li className="nav-item navChats">
                        <Link className='nav-link' to='/chat'>Chat</Link>
                    </li>
                </ul>
                <ul className="navbar-nav ms-auto align-items-center iconCtn">
                    <li className="nav-item searchIcon">
                        <Link className='nav-link' to='/search'><span className="bi bi-search"></span></Link>
                    </li>
                    <li className="nav-item notifIcon" style={{ position: 'relative', cursor: 'pointer' }}>
                        <span 
                            className="bi bi-bell"
                            onClick={() => setShowNotifications(!showNotifications)}
                        ></span>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -5,
                                right: -5,
                                backgroundColor: 'red',
                                color: 'white',
                                borderRadius: '50%',
                                width: 18,
                                height: 18,
                                fontSize: 11,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {showNotifications && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: 8,
                                width: 320,
                                maxHeight: 400,
                                backgroundColor: 'white',
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                zIndex: 1000,
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong>Notifications</strong>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                                    {notificationsLoading ? (
                                        <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>
                                    ) : notifications.length === 0 ? (
                                        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No notifications</div>
                                    ) : (
                                        notifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                style={{
                                                    padding: 12,
                                                    borderBottom: '1px solid #eee',
                                                    backgroundColor: notif.is_read ? 'white' : '#f0f7ff',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={(e) => {
                                                    if (!notif.is_read) {
                                                        handleMarkAsRead(notif.id, e);
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: notif.is_read ? 'normal' : 'bold', fontSize: 14 }}>
                                                            {notif.title}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                            {notif.content}
                                                        </div>
                                                        <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                                                            {new Date(notif.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleDelete(notif.id, e)}
                                                        style={{
                                                            padding: '2px 6px',
                                                            fontSize: 10,
                                                            backgroundColor: '#f44336',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: 3,
                                                            cursor: 'pointer',
                                                            marginLeft: 8
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </li>
                    <li className="nav-item profileIcon">
                        <Link className='nav-link' to='/profile'><span className="bi bi-person"></span></Link>
                    </li>
                </ul>
            </div>
            {showNotifications && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999
                    }}
                    onClick={() => setShowNotifications(false)}
                />
            )}
        </nav>
    )
}

export default Navbar;