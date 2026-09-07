import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";

const STATUS_FILTERS = [
    { value: "all", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Processing", label: "Processing" },
    { value: "Ready for Pickup", label: "Ready" },
    { value: "Completed", label: "Completed" },
    { value: "Rejected", label: "Rejected" },
];

const TYPE_FILTERS = [
    { value: "all", label: "All" },
    { value: "registered", label: "Registered" },
    { value: "guest", label: "Guest" },
];

export default function ManageRequests() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [busyId, setBusyId] = useState(null);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get("/staff/requests");
            setRequests(response.data.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const flash = (message, isError = false) => {
        if (isError) {
            setActionError(message);
            setActionMessage("");
        } else {
            setActionMessage(message);
            setActionError("");
        }
        window.setTimeout(() => {
            setActionMessage("");
            setActionError("");
        }, 4000);
    };

    const getRequesterName = (request) => {
        if (request.request_type === "registered" && request.user) {
            return `${request.user.first_name} ${request.user.last_name}`;
        }
        if (request.request_type === "guest") {
            const g = request.guest || request;
            if (g.first_name) {
                return `${g.first_name} ${g.last_name}`;
            }
        }
        return "Unknown";
    };

    const handleStatusUpdate = async (request, newStatus) => {
        const confirmAction = window.confirm(
            `Change status of ${request.tracking_number} to "${newStatus}"?`
        );
        if (!confirmAction) return;

        const endpoint =
            request.request_type === "guest"
                ? `/guest-requests/${request.request_id}`
                : `/barangay-requests/${request.request_id}`;

        try {
            setBusyId(`${request.request_type}-${request.request_id}`);
            await api.put(endpoint, { status: newStatus });
            flash(`Request ${request.tracking_number} updated to ${newStatus}.`);
            await fetchRequests();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Failed to update status.";
            flash(msg, true);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (request) => {
        const confirmDelete = window.confirm(
            `Permanently delete ${request.tracking_number}? This cannot be undone.`
        );
        if (!confirmDelete) return;

        const endpoint =
            request.request_type === "guest"
                ? `/guest-requests/${request.request_id}`
                : `/barangay-requests/${request.request_id}`;

        try {
            setBusyId(`${request.request_type}-${request.request_id}`);
            await api.delete(endpoint);
            flash(`Request ${request.tracking_number} has been deleted.`);
            await fetchRequests();
        } catch (err) {
            console.error(err);
            const msg =
                err.response?.data?.message || "Failed to delete request.";
            flash(msg, true);
        } finally {
            setBusyId(null);
        }
    };

    const filtered = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return requests.filter((request) => {
            if (
                statusFilter !== "all" &&
                (request.status || "").toLowerCase() !==
                    statusFilter.toLowerCase()
            ) {
                return false;
            }

            if (typeFilter !== "all" && request.request_type !== typeFilter) {
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
    }, [requests, search, statusFilter, typeFilter]);

    const counts = useMemo(() => {
        const result = {
            total: requests.length,
            pending: 0,
            approved: 0,
            processing: 0,
            ready: 0,
            completed: 0,
            rejected: 0,
        };

        requests.forEach((req) => {
            const s = (req.status || "").toLowerCase();
            if (s === "pending") result.pending++;
            else if (s === "approved") result.approved++;
            else if (s === "processing") result.processing++;
            else if (s === "ready for pickup") result.ready++;
            else if (s === "completed") result.completed++;
            else if (s === "rejected") result.rejected++;
        });

        return result;
    }, [requests]);

    const statCards = [
        { label: "Total", value: counts.total, color: "#14532d" },
        { label: "Pending", value: counts.pending, color: "#f59e0b" },
        { label: "Approved", value: counts.approved, color: "#3b82f6" },
        { label: "Processing", value: counts.processing, color: "#8b5cf6" },
        { label: "Ready", value: counts.ready, color: "#10b981" },
        { label: "Completed", value: counts.completed, color: "#16a34a" },
        { label: "Rejected", value: counts.rejected, color: "#dc2626" },
    ];

    const getValidIdImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading requests...</p>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <p>{error}</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                REQUEST MANAGEMENT
                            </span>

                            <h1>Manage Requests</h1>

                            <p>
                                Review every document request submitted by
                                registered residents and walk-in guests.
                                Approve, reject, or advance each request
                                through the processing pipeline.
                            </p>
                        </div>
                    </div>

                    <section className="dashboard-section">
                        <div className="row g-3">
                            {statCards.map((stat) => (
                                <div
                                    className="col-sm-6 col-md-4 col-xl"
                                    key={stat.label}
                                >
                                    <div className="dashboard-stat-card">
                                        <div
                                            className="dashboard-stat-icon"
                                            style={{
                                                backgroundColor:
                                                    stat.color + "22",
                                                color: stat.color,
                                            }}
                                        >
                                            {stat.label[0]}
                                        </div>
                                        <div>
                                            <span className="dashboard-stat-label">
                                                {stat.label}
                                            </span>
                                            <strong className="dashboard-stat-value">
                                                {stat.value}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {actionMessage && (
                        <div
                            className="alert alert-success"
                            role="alert"
                        >
                            {actionMessage}
                        </div>
                    )}

                    {actionError && (
                        <div className="alert alert-danger" role="alert">
                            {actionError}
                        </div>
                    )}

                    <section className="dashboard-section">
                        <div
                            className="admin-filters"
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="search"
                                className="form-control"
                                placeholder="Search by tracking number, name, document, purpose..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                style={{ maxWidth: "380px", flex: "1 1 280px" }}
                            />

                            <select
                                className="form-select"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                style={{ maxWidth: "180px" }}
                            >
                                {STATUS_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        Status: {filter.label}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-select"
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(event.target.value)
                                }
                                style={{ maxWidth: "180px" }}
                            >
                                {TYPE_FILTERS.map((filter) => (
                                    <option
                                        key={filter.value}
                                        value={filter.value}
                                    >
                                        Type: {filter.label}
                                    </option>
                                ))}
                            </select>

                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
                            >
                                Showing {filtered.length} of {requests.length}{" "}
                                request{requests.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon">
                                    📋
                                </div>
                                <h3>No Requests Found</h3>
                                <p>
                                    No document requests match your current
                                    filters. Try clearing the filters to see
                                    all requests.
                                </p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {filtered.map((request) => {
                                    const reqId =
                                        request.request_id ||
                                        request.guest_request_id;
                                    const reqType =
                                        request.request_type || "registered";
                                    const isBusy =
                                        busyId ===
                                        `${reqType}-${reqId}`;
                                    const idImage =
                                        request.guest?.valid_id_image;

                                    return (
                                        <div className="col-12" key={`${reqType}-${reqId}`}>
                                            <div className="admin-management-card">
                                                <div
                                                    className="admin-management-icon"
                                                    style={{
                                                        backgroundColor:
                                                            reqType ===
                                                            "registered"
                                                                ? "#dcfce7"
                                                                : "#fef3c7",
                                                    }}
                                                >
                                                    {reqType === "registered"
                                                        ? "👤"
                                                        : "🧑"}
                                                </div>

                                                <div className="admin-management-content">
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "flex-start",
                                                            flexWrap: "wrap",
                                                            gap: "10px",
                                                        }}
                                                    >
                                                        <div>
                                                            <h3
                                                                style={{
                                                                    marginBottom:
                                                                        "4px",
                                                                }}
                                                            >
                                                                {getRequesterName(
                                                                    request
                                                                )}
                                                            </h3>
                                                            <p
                                                                style={{
                                                                    marginBottom:
                                                                        "8px",
                                                                    fontSize:
                                                                        "13px",
                                                                }}
                                                            >
                                                                <strong>
                                                                    {
                                                                        request.tracking_number
                                                                    }
                                                                </strong>
                                                                {" • "}
                                                                <span
                                                                    style={{
                                                                        textTransform:
                                                                            "capitalize",
                                                                    }}
                                                                >
                                                                    {reqType}
                                                                </span>
                                                                {" • "}
                                                                {request
                                                                    .document_type
                                                                    ?.document_name ||
                                                                    "Unknown"}
                                                            </p>
                                                        </div>

                                                        <StatusBadge
                                                            status={
                                                                request.status
                                                            }
                                                        />
                                                    </div>

                                                    <p
                                                        style={{
                                                            fontSize: "14px",
                                                            margin: "8px 0",
                                                        }}
                                                    >
                                                        <strong>
                                                            Purpose:
                                                        </strong>{" "}
                                                        {request.purpose ||
                                                            "—"}
                                                    </p>

                                                    {request.remarks && (
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    "13px",
                                                                margin:
                                                                    "4px 0",
                                                                color: "#6b7280",
                                                            }}
                                                        >
                                                            <strong>
                                                                Remarks:
                                                            </strong>{" "}
                                                            {request.remarks}
                                                        </p>
                                                    )}

                                                    {idImage && (
                                                        <p
                                                            style={{
                                                                marginBottom:
                                                                    "10px",
                                                            }}
                                                        >
                                                            <strong
                                                                style={{
                                                                    fontSize:
                                                                        "13px",
                                                                }}
                                                            >
                                                                Valid ID:
                                                            </strong>{" "}
                                                            <a
                                                                href={getValidIdImageUrl(
                                                                    idImage
                                                                )}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                style={{
                                                                    color: "#166534",
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                View uploaded ID
                                                            </a>
                                                        </p>
                                                    )}

                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#9ca3af",
                                                            marginBottom:
                                                                "12px",
                                                        }}
                                                    >
                                                        Submitted:{" "}
                                                        {formatDate(
                                                            request.created_at
                                                        )}
                                                    </p>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-success btn-sm"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/requests/${reqType}/${reqId}`
                                                                )
                                                            }
                                                        >
                                                            View Details
                                                        </button>

                                                        {request.status ===
                                                            "Pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-success btn-sm"
                                                                    disabled={
                                                                        isBusy
                                                                    }
                                                                    onClick={() =>
                                                                        handleStatusUpdate(
                                                                            request,
                                                                            "Approved"
                                                                        )
                                                                    }
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-danger btn-sm"
                                                                    disabled={
                                                                        isBusy
                                                                    }
                                                                    onClick={() =>
                                                                        handleStatusUpdate(
                                                                            request,
                                                                            "Rejected"
                                                                        )
                                                                    }
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {request.status ===
                                                            "Approved" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary btn-sm"
                                                                disabled={isBusy}
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        request,
                                                                        "Processing"
                                                                    )
                                                                }
                                                            >
                                                                Start Processing
                                                            </button>
                                                        )}

                                                        {request.status ===
                                                            "Processing" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-info btn-sm"
                                                                disabled={isBusy}
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        request,
                                                                        "Ready for Pickup"
                                                                    )
                                                                }
                                                            >
                                                                Ready for Pickup
                                                            </button>
                                                        )}

                                                        {request.status ===
                                                            "Ready for Pickup" && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-success btn-sm"
                                                                disabled={isBusy}
                                                                onClick={() =>
                                                                    handleStatusUpdate(
                                                                        request,
                                                                        "Completed"
                                                                    )
                                                                }
                                                            >
                                                                Mark Completed
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger btn-sm"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                handleDelete(
                                                                    request
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
