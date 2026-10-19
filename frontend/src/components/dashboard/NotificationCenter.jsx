import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingId, setMarkingId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchNotifications = useCallback(async () => {
        const [notificationsResponse, unreadResponse] = await Promise.all([
            api.get("/notifications", { params: { per_page: 5 } }),
            api.get("/notifications/unread-count"),
        ]);
        const page = notificationsResponse.data?.data;
        const unread = unreadResponse.data?.data?.unread_count;

        if (!Array.isArray(page?.data) || !Number.isInteger(unread)) {
            throw new Error("Unexpected notifications response.");
        }

        return { notifications: page.data, unreadCount: unread };
    }, []);

    useEffect(() => {
        let active = true;

        const loadNotifications = async () => {
            try {
                const data = await fetchNotifications();
                if (active) {
                    setNotifications(data.notifications);
                    setUnreadCount(data.unreadCount);
                }
            } catch (fetchError) {
                console.error(
                    "Failed to load dashboard notifications:",
                    fetchError
                );
                if (active) {
                    setError("Notifications could not be loaded.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadNotifications();

        return () => {
            active = false;
        };
    }, [fetchNotifications, refreshKey]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRefreshKey((current) => current + 1);
    };

    const markAsRead = async (notification) => {
        setMarkingId(notification.notification_id);
        setError("");

        try {
            await api.patch(
                `/notifications/${notification.notification_id}/read`
            );
            setNotifications((current) =>
                current.map((item) =>
                    item.notification_id === notification.notification_id
                        ? { ...item, is_read: true }
                        : item
                )
            );
            if (!notification.is_read) {
                setUnreadCount((current) => Math.max(0, current - 1));
            }
        } catch (markError) {
            console.error("Failed to mark notification as read:", markError);
            setError("Could not mark this notification as read.");
        } finally {
            setMarkingId(null);
        }
    };

    return (
        <section className="dashboard-notifications" aria-labelledby="dashboard-notifications-title">
            <div className="dashboard-notifications-header">
                <div>
                    <span className="dashboard-notifications-label">
                        UPDATES
                    </span>
                    <h2 id="dashboard-notifications-title">
                        Notifications
                    </h2>
                </div>
                {!loading && unreadCount !== null && (
                    <span className="dashboard-notification-count">
                        {unreadCount} unread
                    </span>
                )}
            </div>

            {error && (
                <div className="dashboard-notification-error" role="alert">
                    {error}{" "}
                    <button type="button" onClick={handleRetry}>
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <p className="dashboard-notification-message">
                    Loading notifications...
                </p>
            ) : notifications.length ? (
                <div className="dashboard-notification-list">
                    {notifications.slice(0, 5).map((notification) => (
                        <article
                            className={`dashboard-notification ${
                                notification.is_read ? "" : "unread"
                            }`}
                            key={notification.notification_id}
                        >
                            <div className="dashboard-notification-copy">
                                <strong>{notification.title}</strong>
                                <p>{notification.message}</p>
                                <time dateTime={notification.created_at}>
                                    {notification.created_at
                                        ? new Date(
                                              notification.created_at
                                          ).toLocaleString()
                                        : ""}
                                </time>
                            </div>
                            {!notification.is_read && (
                                <button
                                    type="button"
                                    className="dashboard-notification-read"
                                    disabled={markingId === notification.notification_id}
                                    onClick={() => markAsRead(notification)}
                                >
                                    {markingId === notification.notification_id
                                        ? "Saving..."
                                        : "Mark read"}
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            ) : (
                <p className="dashboard-notification-message">
                    You’re all caught up.
                </p>
            )}
        </section>
    );
}

export default NotificationCenter;
