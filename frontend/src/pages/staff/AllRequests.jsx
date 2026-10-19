import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PortalLayout from "../../layouts/PortalLayout";
import StatusBadge from "../../components/ui/StatusBadge";

/*
|--------------------------------------------------------------------------
| Staff — All Requests
|--------------------------------------------------------------------------
| Full searchable, filterable list of barangay requests.
| Staff can approve/reject/advance/delete directly from this list, or
| click through to the details page for full info.
|--------------------------------------------------------------------------
*/

const navigationItems = [
    { label: "Dashboard", to: "/staff/dashboard", icon: "▦" },
    { label: "All Requests", to: "/staff/requests", icon: "📋" },
];

const STATUS_FILTERS = [
    { value: "all", label: "All Statuses" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Processing", label: "Processing" },
    { value: "Ready for Pickup", label: "Ready for Pickup" },
    { value: "Completed", label: "Completed" },
    { value: "Rejected", label: "Rejected" },
];

const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "—";

function getRequesterName(request) {
    if (request.user) {
        return `${request.user.first_name} ${request.user.last_name}`;
    }
    return "Unknown";
}

export default function AllRequests() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [busyId, setBusyId] = useState(null);
    const [flashMessage, setFlashMessage] = useState("");
    const [flashError, setFlashError] = useState("");

    const flash = (msg, isError = false) => {
        if (isError) {
            setFlashError(msg);
            setFlashMessage("");
        } else {
            setFlashMessage(msg);
            setFlashError("");
        }
        setTimeout(() => {
            setFlashMessage("");
            setFlashError("");
        }, 4000);
    };

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get("/staff/requests");
            setRequests(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load requests. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleStatusUpdate = async (request, newStatus) => {
        const key = request.request_id;
        const confirmAction = window.confirm(
            `Change status of ${request.tracking_number} to "${newStatus}"?`
        );
        if (!confirmAction) return;

        try {
            setBusyId(key);
            await api.put(`/barangay-requests/${request.request_id}`, {
                status: newStatus,
            });
            flash(
                `${request.tracking_number} updated to "${newStatus}".`
            );
            await fetchRequests();
        } catch (err) {
            console.error(err);
            flash(
                err.response?.data?.message || "Failed to update status.",
                true
            );
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (request) => {
        const key = request.request_id;
        const confirmDelete = window.confirm(
            `Permanently delete ${request.tracking_number}? This cannot be undone.`
        );
        if (!confirmDelete) return;

        try {
            setBusyId(key);
            await api.delete(`/barangay-requests/${request.request_id}`);
            flash(`Request ${request.tracking_number} has been deleted.`);
            await fetchRequests();
        } catch (err) {
            console.error(err);
            flash(
                err.response?.data?.message || "Failed to delete request.",
                true
            );
        } finally {
            setBusyId(null);
        }
    };

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return requests.filter((req) => {
            if (
                statusFilter !== "all" &&
                (req.status || "").toLowerCase() !==
                statusFilter.toLowerCase()
            )
                return false;

            if (needle) {
                const haystack = [
                    req.tracking_number,
                    getRequesterName(req),
                    req.document_type?.document_name,
                    req.purpose,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(needle)) return false;
            }

            return true;
        });
    }, [requests, search, statusFilter]);

    const counts = useMemo(() => {
        const result = { total: 0, pending: 0, processing: 0, completed: 0 };
        requests.forEach((req) => {
            result.total += 1;
            const s = (req.status || "").toLowerCase();
            if (s === "pending") result.pending += 1;
            if (s === "processing") result.processing += 1;
            if (s === "completed") result.completed += 1;
        });
        return result;
    }, [requests]);

    return (
        <PortalLayout portalLabel="STAFF SERVICES" sidebarItems={navigationItems}>
            <section className="staff-portal">

                {/* ── Header ── */}
                <div className="staff-welcome" style={{ marginBottom: 16 }}>
                    <div>
                        <span className="staff-section-label">
                            REQUEST MANAGEMENT
                        </span>
                        <h1 style={{ marginTop: 4 }}>All Requests</h1>
                        <p>
                            Review, process, and manage every document request
                            submitted by registered residents.
                        </p>
                    </div>
                    <div className="staff-status-badge">
                        <span className="staff-status-dot" />
                        STAFF ACCOUNT
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="staff-stat-grid" style={{ marginBottom: 16 }}>
                    {[
                        { label: "TOTAL", value: counts.total, desc: "All requests" },
                        { label: "PENDING", value: counts.pending, desc: "Awaiting action" },
                        { label: "PROCESSING", value: counts.processing, desc: "Being handled" },
                        { label: "COMPLETED", value: counts.completed, desc: "Finished" },
                    ].map((stat) => (
                        <div className="staff-stat-card" key={stat.label}>
                            <div className="staff-stat-top">
                                <span className="staff-stat-label">{stat.label}</span>
                                <span className="staff-stat-number">
                                    {loading ? "—" : stat.value}
                                </span>
                            </div>
                            <p>{stat.desc}</p>
                        </div>
                    ))}
                </div>

                {/* ── Flash ── */}
                {flashMessage && (
                    <div className="staff-flash staff-flash-success">
                        {flashMessage}
                    </div>
                )}
                {flashError && (
                    <div className="staff-flash staff-flash-error">
                        {flashError}
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="staff-work-card" style={{ marginBottom: 12 }}>
                    <div className="staff-filters-row">
                        <input
                            type="search"
                            className="staff-filter-input"
                            placeholder="Search by tracking number, name, document, purpose…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <select
                            className="staff-filter-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {STATUS_FILTERS.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>

                        <span className="staff-filter-count">
                            {loading
                                ? "Loading…"
                                : `${filtered.length} of ${requests.length} request${requests.length === 1 ? "" : "s"
                                }`}
                        </span>
                    </div>
                </div>

                {/* ── Request List ── */}
                {error ? (
                    <div className="staff-work-card">
                        <div className="staff-empty-state">
                            <div className="staff-empty-icon">⚠️</div>
                            <h3>Unable to Load Requests</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="staff-btn staff-btn-primary"
                                onClick={fetchRequests}
                                style={{ marginTop: 12 }}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="staff-work-card">
                        <div className="staff-empty-state">
                            <div className="staff-empty-icon">⏳</div>
                            <p>Loading requests…</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="staff-work-card">
                        <div className="staff-empty-state">
                            <div className="staff-empty-icon">≡</div>
                            <h3>No Requests Found</h3>
                            <p>
                                No document requests match the current filters.
                                Try clearing the search or changing the filters.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="staff-all-requests-list">
                        {filtered.map((request) => {
                            const reqId = request.request_id;
                            const key = reqId;
                            const isBusy = busyId === key;
                            const requesterName = getRequesterName(request);
                            const isFinal =
                                request.status === "Completed" ||
                                request.status === "Rejected";

                            return (
                                <div
                                    className="staff-request-card"
                                    key={key}
                                >
                                    {/* Card Top */}
                                    <div className="staff-request-card-top">
                                        <div
                                            className="staff-request-type-icon"
                                            style={{
                                                backgroundColor: "#dcfce7",
                                            }}
                                        >
                                            👤
                                        </div>

                                        <div className="staff-request-card-meta">
                                            <div className="staff-request-card-title-row">
                                                <strong>{requesterName}</strong>
                                                <StatusBadge
                                                    status={request.status}
                                                    size="sm"
                                                />
                                            </div>
                                            <div className="staff-request-card-sub">
                                                <span className="staff-request-tracking">
                                                    {request.tracking_number}
                                                </span>
                                                <span>·</span>
                                                <span>Registered</span>
                                                <span>·</span>
                                                <span>
                                                    {request.document_type
                                                        ?.document_name ||
                                                        "Document request"}
                                                </span>
                                            </div>

                                            {request.purpose && (
                                                <p className="staff-request-purpose">
                                                    {request.purpose}
                                                </p>
                                            )}

                                            <p className="staff-request-date">
                                                Submitted:{" "}
                                                {formatDate(request.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Actions */}
                                    <div className="staff-request-card-actions">
                                        <button
                                            type="button"
                                            className="staff-btn staff-btn-outline"
                                            disabled={isBusy}
                                            onClick={() =>
                                                navigate(
                                                    `/staff/requests/${reqId}`
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        {!isFinal && request.status === "Pending" && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="staff-btn staff-btn-success"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request,
                                                            "Approved"
                                                        )
                                                    }
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    type="button"
                                                    className="staff-btn staff-btn-danger"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleStatusUpdate(
                                                            request,
                                                            "Rejected"
                                                        )
                                                    }
                                                >
                                                    ✕ Reject
                                                </button>
                                            </>
                                        )}

                                        {request.status === "Approved" && (
                                            <button
                                                type="button"
                                                className="staff-btn staff-btn-primary"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Processing"
                                                    )
                                                }
                                            >
                                                ▶ Start Processing
                                            </button>
                                        )}

                                        {request.status === "Processing" && (
                                            <button
                                                type="button"
                                                className="staff-btn staff-btn-info"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Ready for Pickup"
                                                    )
                                                }
                                            >
                                                📦 Ready for Pickup
                                            </button>
                                        )}

                                        {request.status === "Ready for Pickup" && (
                                            <button
                                                type="button"
                                                className="staff-btn staff-btn-success"
                                                disabled={isBusy}
                                                onClick={() =>
                                                    handleStatusUpdate(
                                                        request,
                                                        "Completed"
                                                    )
                                                }
                                            >
                                                ✓ Mark Completed
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="staff-btn staff-btn-outline-danger"
                                            disabled={isBusy}
                                            onClick={() => handleDelete(request)}
                                            style={{ marginLeft: "auto" }}
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </PortalLayout>
    );
}
