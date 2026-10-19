function NotificationCenter() {
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
            </div>
            <p className="dashboard-notification-message">
                Notifications are unavailable because this API has no
                notification endpoints.
            </p>
        </section>
    );
}

export default NotificationCenter;
