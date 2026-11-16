import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import PortalLayout from "../../layouts/PortalLayout";
import { STAFF_NAV_ITEMS } from "../../layouts/staffNavigation";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import StatusBadge from "../../components/ui/StatusBadge";
import useLiveRefresh from "../../hooks/useLiveRefresh";
import {
    canonicalRequestStatus,
    isInCurrentWorkflow,
    REQUEST_STATUS_OPTIONS,
} from "../../utils/requestWorkflow";
import "./manage-requests.css";

const PAGE_SIZE = 10;
const REQUEST_TOAST_DURATION_MS = 3 * 60 * 1000;

const requestListStatus = (status) => {
    const normalizedStatus = canonicalRequestStatus(status);
    return normalizedStatus === "approved"
        ? "request_submitted"
        : normalizedStatus;
};

export default function ManageRequests({ isAdmin = true } = {}) {
    const navigate = useNavigate();
    const renderLayout = (children) =>
        isAdmin ? (
            <AdminLayout>{children}</AdminLayout>
        ) : (
            <PortalLayout
                portalLabel="STAFF SERVICES"
                sidebarItems={STAFF_NAV_ITEMS}
            >
                {children}
            </PortalLayout>
        );

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshError, setRefreshError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [requestNotifications, setRequestNotifications] = useState([]);
    const [toastNotificationId, setToastNotificationId] = useState(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationError, setNotificationError] = useState("");
    const [openingNotificationId, setOpeningNotificationId] = useState(null);
    const seenRequestNotificationIds = useRef(null);

    const fetchRequests = useCallback(async () => {
        const response = await api.get("/staff/requests");
        const data = response.data?.data;
        if (!Array.isArray(data)) {
            throw new Error("Unexpected staff requests response.");
        }
        setRequests(data.filter(isInCurrentWorkflow));
    }, []);

    const loadRequests = useCallback(
        async (initial = false) => {
            try {
                await fetchRequests();
                setError("");
                setRefreshError("");
            } catch (requestError) {
                console.error(requestError);
                if (initial) setError("Failed to load requests.");
                else setRefreshError("Requests could not be refreshed.");
            } finally {
                if (initial) setLoading(false);
            }
        },
        [fetchRequests],
    );

    useEffect(() => {
        Promise.resolve().then(() => loadRequests(true));
    }, [loadRequests]);

    useLiveRefresh(loadRequests);

    useEffect(() => {
        let active = true;
        let polling = false;

        const pollNotifications = async () => {
            if (
                !active ||
                polling ||
                document.visibilityState !== "visible"
            ) {
                return;
            }

            polling = true;
            try {
                const response = await api.get("/notifications", {
                    params: { per_page: 30 },
                });
                const notifications = response.data?.data?.data;
                if (!Array.isArray(notifications)) {
                    throw new Error("Unexpected notifications response.");
                }
                if (!active) return;
                setNotificationError("");

                const requestNotifications = notifications.filter(
                    (notification) =>
                        notification.type === "new_request" &&
                        notification.request_id,
                );

                if (seenRequestNotificationIds.current === null) {
                    seenRequestNotificationIds.current = new Set(
                        requestNotifications.map(
                            (notification) => notification.notification_id,
                        ),
                    );
                    setRequestNotifications(requestNotifications);
                    setToastNotificationId(
                        requestNotifications.find(
                            (notification) => !notification.is_read,
                        )?.notification_id ?? null,
                    );
                    return;
                }

                const seenIds = seenRequestNotificationIds.current;
                const newNotifications = requestNotifications.filter(
                    (notification) =>
                        !seenIds.has(notification.notification_id),
                );
                newNotifications.forEach((notification) =>
                    seenIds.add(notification.notification_id),
                );
                if (newNotifications.length > 0) {
                    void loadRequests();
                }
                setRequestNotifications(requestNotifications);
                const nextToast = newNotifications.find(
                    (notification) => !notification.is_read,
                );
                if (nextToast) {
                    setToastNotificationId((current) =>
                        current ?? nextToast.notification_id,
                    );
                }
            } catch (pollError) {
                console.error("Failed to refresh new-request notifications:", pollError);
                if (active) {
                    setNotificationError(
                        "New request notifications could not be refreshed.",
                    );
                }
            } finally {
                polling = false;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void pollNotifications();
            }
        };

        void pollNotifications();
        const timer = window.setInterval(pollNotifications, 5000);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            active = false;
            window.clearInterval(timer);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [loadRequests]);

    useEffect(() => {
        if (toastNotificationId === null) return undefined;

        const timer = window.setTimeout(
            () => setToastNotificationId(null),
            REQUEST_TOAST_DURATION_MS,
        );
        return () => window.clearTimeout(timer);
    }, [toastNotificationId]);

    useEffect(() => {
        if (!notificationsOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setNotificationsOpen(false);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [notificationsOpen]);

    const openRequestNotification = async (notification) => {
        setOpeningNotificationId(notification.notification_id);
        setNotificationError("");

        try {
            await api.patch(
                `/notifications/${notification.notification_id}/read`,
            );
            navigate(
                `/${isAdmin ? "admin" : "staff"}/requests/${notification.request_id}`,
            );
        } catch (markError) {
            console.error("Failed to open new-request notification:", markError);
            setNotificationError(
                "The request could not be opened. Please try again.",
            );
        } finally {
            setOpeningNotificationId(null);
        }
    };

    const dismissRequestToast = () => {
        setToastNotificationId(null);
        setNotificationError("");
    };

    const activeToast = requestNotifications.find(
        (notification) =>
            notification.notification_id === toastNotificationId,
    );
    const unreadRequestCount = requestNotifications.filter(
        (notification) => !notification.is_read,
    ).length;

    const getRequesterName = (request) => {
        if (request.user) {
            return `${request.user.first_name} ${request.user.last_name}`;
        }
        return "Unknown";
    };

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return requests.filter((request) => {
            if (
                statusFilter !== "all" &&
                requestListStatus(request.status) !== statusFilter
            ) {
                return false;
            }

            if (needle) {
                const haystack = [
                    request.tracking_number,
                    getRequesterName(request),
                    request.document_type?.document_name,
                    request.purpose,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(needle)) return false;
            }

            return true;
        });
    }, [requests, search, statusFilter]);

    const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
    const currentPage = Math.min(page, Math.max(pageCount, 1));
    const pageRequests = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    if (loading) {
        return renderLayout(
            <SkeletonLoader label="Loading requests" variant="table" />,
        );
    }

    if (error) {
        return renderLayout(
            <div className="page-loading">
                <div className="app-alert app-alert-danger" role="alert">
                    {error}
                </div>
            </div>,
        );
    }

    return renderLayout(
        <div
            className={`admin-dashboard manage-requests-page${
                isAdmin ? "" : " staff-manage-requests-page"
            }`}
        >
            <div className="w-full">
                {activeToast && (
                    <aside
                        className="new-request-toast"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="new-request-toast-copy">
                            <strong>
                                {activeToast.title ||
                                    "New Barangay Request"}
                            </strong>
                            <p>{activeToast.message}</p>
                            {notificationError && (
                                <span className="new-request-toast-error">
                                    {notificationError}
                                </span>
                            )}
                        </div>
                        <div className="new-request-toast-actions">
                            <Button
                                type="button"
                                className="app-button app-button-success app-button-sm"
                                disabled={
                                    openingNotificationId === activeToast.notification_id
                                }
                                onClick={() =>
                                    openRequestNotification(activeToast)
                                }
                            >
                                {openingNotificationId ===
                                activeToast.notification_id
                                    ? "Opening..."
                                    : "View request"}
                            </Button>
                            <Button
                                type="button"
                                className="app-button app-button-outline-secondary app-button-sm"
                                disabled={openingNotificationId !== null}
                                onClick={dismissRequestToast}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </aside>
                )}
                {notificationError &&
                    !activeToast && (
                        <div
                            className="app-alert app-alert-warning"
                            role="status"
                        >
                            {notificationError}
                        </div>
                    )}
                {requestNotifications.length > 0 && !activeToast && (
                    <div className="request-notification-control">
                        {notificationsOpen && (
                            <section
                                className="request-notification-panel"
                                aria-label="New request notifications"
                            >
                                <header className="request-notification-panel-header">
                                    <strong>Request notifications</strong>
                                    <span>
                                        {unreadRequestCount} unread
                                    </span>
                                </header>
                                {notificationError && (
                                    <p
                                        className="request-notification-panel-error"
                                        role="alert"
                                    >
                                        {notificationError}
                                    </p>
                                )}
                                <div className="request-notification-list">
                                    {requestNotifications.length ? (
                                        requestNotifications.map(
                                            (notification) => (
                                                <button
                                                    className={`request-notification-item ${
                                                        notification.is_read
                                                            ? ""
                                                            : "unread"
                                                    }`}
                                                    disabled={
                                                        openingNotificationId ===
                                                        notification.notification_id
                                                    }
                                                    key={notification.notification_id}
                                                    onClick={() =>
                                                        openRequestNotification(
                                                            notification,
                                                        )
                                                    }
                                                    type="button"
                                                >
                                                    <strong>
                                                        {notification.title ||
                                                            "New Barangay Request"}
                                                    </strong>
                                                    <span>
                                                        {notification.message}
                                                    </span>
                                                    <time
                                                        dateTime={
                                                            notification.created_at
                                                        }
                                                    >
                                                        {notification.created_at
                                                            ? new Date(
                                                                  notification.created_at,
                                                              ).toLocaleString()
                                                            : ""}
                                                    </time>
                                                </button>
                                            ),
                                        )
                                    ) : (
                                        <p className="request-notification-empty">
                                            No request notifications yet.
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}
                        <button
                            aria-expanded={notificationsOpen}
                            aria-label={
                                notificationsOpen
                                    ? "Close request notifications"
                                    : `Open request notifications${
                                          unreadRequestCount
                                              ? `, ${unreadRequestCount} unread`
                                              : ""
                                      }`
                            }
                            className="request-notification-bell"
                            onClick={() =>
                                setNotificationsOpen((current) => !current)
                            }
                            type="button"
                        >
                            <Icon name="bell" size={22} />
                            {unreadRequestCount > 0 && (
                                <span className="request-notification-badge">
                                    {unreadRequestCount > 99
                                        ? "99+"
                                        : unreadRequestCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
                <div className="dashboard-page-header">
                    <div>
                        <span className="section-label">
                            REQUEST MANAGEMENT
                        </span>
                        <h1>Manage Requests</h1>
                        <p>
                            Review resident submissions and process each
                            request through decision, document preparation,
                            pickup, and completion.
                        </p>
                    </div>
                </div>

                {refreshError && (
                    <div className="app-alert app-alert-warning" role="status">
                        {refreshError}
                    </div>
                )}

                <section className="dashboard-section">
                    <div className="admin-filters filter-bar filter-row">
                        <input
                            type="search"
                            className="app-input filter-search-380"
                            placeholder="Search by tracking number, name, document, purpose..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />

                        <select
                            className="app-select filter-select-180"
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                        >
                            {REQUEST_STATUS_OPTIONS.map((filter) => (
                                <option key={filter.value} value={filter.value}>
                                    Status: {filter.label}
                                </option>
                            ))}
                        </select>

                        <div className="filter-count">
                            Showing{" "}
                            {filtered.length === 0
                                ? "0"
                                : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                      currentPage * PAGE_SIZE,
                                      filtered.length,
                                  )}`}{" "}
                            of {filtered.length} matching request
                            {filtered.length === 1 ? "" : "s"} ({requests.length}{" "}
                            total)
                        </div>
                    </div>
                </section>

                <section className="dashboard-section">
                    {filtered.length === 0 ? (
                        <div className="dashboard-empty-state">
                            <div
                                className="dashboard-empty-icon"
                                aria-hidden="true"
                            >
                                <Icon name="inbox" />
                            </div>
                            <h3>No Requests Found</h3>
                            <p>
                                No document requests match your current
                                filters. Try clearing the filters to see all
                                requests.
                            </p>
                        </div>
                    ) : (
                        <div className="table-scroll">
                            <Table className="data-table manage-requests-table">
                                <thead>
                                    <tr>
                                        <th>Requester</th>
                                        <th>Request details</th>
                                        <th>Status</th>
                                        <th>Purpose and notes</th>
                                        <th>Submitted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRequests.map((request) => {
                                        const reqId = request.request_id;

                                        return (
                                            <tr key={reqId}>
                                                <td>
                                                    <strong>
                                                        {getRequesterName(
                                                            request,
                                                        )}
                                                    </strong>
                                                    <div className="data-table-subtext">
                                                        {request.tracking_number}
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong>
                                                        {request.document_type
                                                            ?.document_name ||
                                                            "Unknown"}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        status={requestListStatus(
                                                            request.status,
                                                        )}
                                                    />
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>Purpose:</strong>{" "}
                                                        {request.purpose || "—"}
                                                    </div>
                                                    {request.rejection_reason && (
                                                        <div className="data-table-subtext">
                                                            <strong>
                                                                Rejection
                                                                reason:
                                                            </strong>{" "}
                                                            {
                                                                request.rejection_reason
                                                            }
                                                        </div>
                                                    )}
                                                    {canonicalRequestStatus(
                                                        request.status,
                                                    ) !== "rejected" &&
                                                        request.decision_at &&
                                                        request.remarks && (
                                                            <div className="data-table-subtext">
                                                                <strong>
                                                                    Decision
                                                                    feedback:
                                                                </strong>{" "}
                                                                {request.remarks}
                                                            </div>
                                                        )}
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        request.created_at,
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="data-table-actions">
                                                        <Button
                                                            type="button"
                                                            className="app-button app-button-outline-success app-button-sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/${isAdmin ? "admin" : "staff"}/requests/${reqId}`,
                                                                )
                                                            }
                                                        >
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </section>

                {pageCount > 1 && (
                    <nav aria-label="Request pagination">
                        <ul className="pagination activity-pagination">
                            <li>
                                <Button
                                    type="button"
                                    className="app-button app-button-outline-secondary app-button-sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                            </li>
                            {Array.from(
                                { length: pageCount },
                                (_, index) => index + 1,
                            ).map((pageNumber) => (
                                <li key={pageNumber}>
                                    <Button
                                        type="button"
                                        variant={
                                            pageNumber === currentPage
                                                ? "default"
                                                : "outline-secondary"
                                        }
                                        size="sm"
                                        aria-current={
                                            pageNumber === currentPage
                                                ? "page"
                                                : undefined
                                        }
                                        aria-label={`Go to page ${pageNumber}`}
                                        onClick={() => setPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </Button>
                                </li>
                            ))}
                            <li>
                                <Button
                                    type="button"
                                    className="app-button app-button-outline-secondary app-button-sm"
                                    disabled={currentPage === pageCount}
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>,
    );
}
