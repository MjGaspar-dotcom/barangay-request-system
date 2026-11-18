import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import useLiveRefresh from "../../hooks/useLiveRefresh";
import { useToast } from "../ui/toast-context";

const REQUEST_TOAST_DURATION_MS = 3 * 60 * 1000;

export default function RequestNotificationToast() {
    const { user } = useAuth();
    const userRole = user?.role;
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { dismissToast, showToast } = useToast();
    const isLoginPage = pathname === "/staff/login" || pathname === "/login";
    const isStaffOrAdmin =
        !isLoginPage && ["admin", "staff"].includes(user?.role);
    const [toastQueue, setToastQueue] = useState([]);
    const [notificationError, setNotificationError] = useState("");
    const [openingNotificationId, setOpeningNotificationId] = useState(null);
    const seenRequestNotificationIds = useRef(null);
    const polling = useRef(false);

    const pollNotifications = useCallback(async () => {
        if (
            !isStaffOrAdmin ||
            polling.current ||
            document.visibilityState !== "visible"
        ) {
            return;
        }

        polling.current = true;
        try {
            const response = await api.get("/notifications", {
                params: { per_page: 30, new_request_toasts: true },
            });
            const notifications = response.data?.data?.data;
            if (!Array.isArray(notifications)) {
                throw new Error("Unexpected notifications response.");
            }

            const requestNotifications = notifications.filter(
                (notification) =>
                    notification.type === "new_request" &&
                    notification.request_id,
            );
            const activeNotificationIds = new Set(
                requestNotifications.map(
                    (notification) => notification.notification_id,
                ),
            );
            setNotificationError("");

            if (seenRequestNotificationIds.current === null) {
                seenRequestNotificationIds.current = new Set(
                    requestNotifications.map(
                        (notification) => notification.notification_id,
                    ),
                );
                return;
            }

            const seenIds = seenRequestNotificationIds.current;
            const newNotifications = requestNotifications.filter(
                (notification) =>
                    !seenIds.has(notification.notification_id) &&
                    !notification.is_read,
            );
            requestNotifications.forEach((notification) =>
                seenIds.add(notification.notification_id),
            );

            setToastQueue((current) => {
                const stillActive = current.filter((notification) =>
                    activeNotificationIds.has(notification.notification_id),
                );
                const queuedIds = new Set(
                    stillActive.map(
                        (notification) => notification.notification_id,
                    ),
                );
                return [
                    ...stillActive,
                    ...newNotifications.filter(
                        (notification) =>
                            !queuedIds.has(notification.notification_id),
                    ),
                ];
            });
        } catch (pollError) {
            console.error(
                "Failed to refresh new-request notifications:",
                pollError,
            );
            setNotificationError(
                "Request notifications could not be refreshed.",
            );
        } finally {
            polling.current = false;
        }
    }, [isStaffOrAdmin]);

    useEffect(() => {
        if (isStaffOrAdmin) return;

        seenRequestNotificationIds.current = null;
        Promise.resolve().then(() => {
            setToastQueue([]);
            setNotificationError("");
        });
    }, [isStaffOrAdmin]);

    useEffect(() => {
        Promise.resolve().then(pollNotifications);
    }, [pollNotifications]);

    useLiveRefresh(pollNotifications);

    const activeToast = toastQueue[0] ?? null;

    const dismissNotification = useCallback((notificationId) => {
        setToastQueue((current) =>
            current.filter(
                (notification) =>
                    notification.notification_id !== notificationId,
            ),
        );
        setNotificationError("");
    }, []);

    const notificationToastId = activeToast
        ? `new-request-${activeToast.notification_id}`
        : "new-request-notification-error";

    const openRequest = useCallback(async () => {
        if (!activeToast) return;

        setOpeningNotificationId(activeToast.notification_id);
        setNotificationError("");
        try {
            await api.patch(
                `/notifications/${activeToast.notification_id}/read`,
            );
            dismissNotification(activeToast.notification_id);
            navigate(
                `/${userRole}/requests/${activeToast.request_id}`,
            );
        } catch (openError) {
            console.error("Failed to open new-request notification:", openError);
            setNotificationError(
                "The request could not be opened. Please try again.",
            );
        } finally {
            setOpeningNotificationId(null);
        }
    }, [activeToast, dismissNotification, navigate, userRole]);

    const dismissActiveToast = useCallback(() => {
        if (activeToast) {
            dismissNotification(activeToast.notification_id);
        } else {
            setNotificationError("");
        }
    }, [activeToast, dismissNotification]);

    useEffect(() => {
        if (!isStaffOrAdmin || (!activeToast && !notificationError)) {
            return undefined;
        }

        showToast({
            id: notificationToastId,
            title:
                activeToast?.title ||
                (notificationError
                    ? "Notification issue"
                    : "New Barangay Request"),
            description:
                [activeToast?.message, notificationError]
                    .filter(Boolean)
                    .join("\n") ||
                "Request notifications could not be refreshed.",
            variant: notificationError ? "warning" : "info",
            duration: activeToast ? REQUEST_TOAST_DURATION_MS : null,
            action: activeToast
                ? {
                      label:
                          openingNotificationId ===
                          activeToast.notification_id
                              ? "Opening..."
                              : "View request",
                      disabled:
                          openingNotificationId ===
                          activeToast.notification_id,
                      onClick: openRequest,
                  }
                : null,
            dismissDisabled: openingNotificationId !== null,
            onDismiss: dismissActiveToast,
        });

        return () => dismissToast(notificationToastId);
    }, [
        activeToast,
        dismissActiveToast,
        dismissToast,
        isStaffOrAdmin,
        notificationError,
        notificationToastId,
        openRequest,
        openingNotificationId,
        showToast,
    ]);

    return null;
}
