import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../static/Notifications.css";
import SkeletonList from "../components/loading/SkeletonList";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.map(n => api.put(`/notifications/${n._id}`)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <h1>🔔 Notifications</h1>
          <p>Stay updated with the latest tournament alerts.</p>
        </div>
        <SkeletonList items={6} />
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllAsRead} className="mark-all-btn">
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-notifications">
          <p>📭 No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`notification-item ${!notif.isRead ? "unread" : ""}`}
              onClick={() => markAsRead(notif._id)}
            >
              <div className="notification-content">
                <p>{notif.message}</p>
                <small>{new Date(notif.createdAt).toLocaleString()}</small>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif._id);
                }}
                className="delete-notif"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}