import { useEffect, useMemo, useState } from "react";
<<<<<<< HEAD
=======
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
    const [busyId, setBusyId] = useState(null);
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState("");
=======
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

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

<<<<<<< HEAD
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

=======
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
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

=======
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
        { label: "Total", value: counts.total, color: "#14532d" },
        { label: "Pending", value: counts.pending, color: "#f59e0b" },
        { label: "Approved", value: counts.approved, color: "#3b82f6" },
        { label: "Processing", value: counts.processing, color: "#8b5cf6" },
        { label: "Ready", value: counts.ready, color: "#10b981" },
        { label: "Completed", value: counts.completed, color: "#16a34a" },
        { label: "Rejected", value: counts.rejected, color: "#dc2626" },
=======
        { label: "Total", value: counts.total, tone: "total" },
        { label: "Pending", value: counts.pending, tone: "pending" },
        { label: "Approved", value: counts.approved, tone: "approved" },
        { label: "Processing", value: counts.processing, tone: "processing" },
        { label: "Ready", value: counts.ready, tone: "ready" },
        { label: "Completed", value: counts.completed, tone: "completed" },
        { label: "Rejected", value: counts.rejected, tone: "rejected" },
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                    <p>{error}</p>
=======
                    <div className="alert alert-danger" role="alert">{error}</div>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
<<<<<<< HEAD
            <div className="admin-dashboard">
=======
            <div className="admin-dashboard manage-requests-page">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                REQUEST MANAGEMENT
                            </span>

                            <h1>Manage Requests</h1>

                            <p>
                                Review every document request submitted by
<<<<<<< HEAD
                                registered residents and walk-in guests.
                                Approve, reject, or advance each request
                                through the processing pipeline.
=======
                                registered residents and walk-in guests. Open
                                a request to review its details and manage its
                                status.
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                        <div
                                            className="dashboard-stat-icon"
                                            style={{
                                                backgroundColor:
                                                    stat.color + "22",
                                                color: stat.color,
                                            }}
                                        >
=======
                                        <div className={`dashboard-stat-icon dashboard-stat-icon-${stat.tone}`}>

>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
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
=======
                    <section className="dashboard-section">
                        <div
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="form-control filter-search-380"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                placeholder="Search by tracking number, name, document, purpose..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "380px", flex: "1 1 280px" }}
                            />

                            <select
                                className="form-select"
=======
                                
                            />

                            <select
                                className="form-select filter-select-180"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "180px" }}
=======
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                                className="form-select"
=======
                                className="form-select filter-select-180"
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(event.target.value)
                                }
<<<<<<< HEAD
                                style={{ maxWidth: "180px" }}
=======
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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

<<<<<<< HEAD
                            <div
                                style={{
                                    marginLeft: "auto",
                                    color: "#6b7280",
                                    fontSize: "14px",
                                }}
=======
                            <div className="filter-count"
                                
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            >
                                Showing {filtered.length} of {requests.length}{" "}
                                request{requests.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
<<<<<<< HEAD
                                <div className="dashboard-empty-icon">
                                    📋
=======
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <i className="bi bi-inbox" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                                </div>
                                <h3>No Requests Found</h3>
                                <p>
                                    No document requests match your current
                                    filters. Try clearing the filters to see
                                    all requests.
                                </p>
                            </div>
                        ) : (
<<<<<<< HEAD
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
=======
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
                                        {filtered.map((request) => {
                                            const reqId = request.request_id || request.guest_request_id;
                                            const reqType = request.request_type || "registered";
                                            const idImage = request.guest?.valid_id_image;

                                            return (
                                                <tr key={`${reqType}-${reqId}`}>
                                                    <td>
                                                        <strong>{getRequesterName(request)}</strong>
                                                        <div className="data-table-subtext">{request.tracking_number}</div>
                                                        <div className="data-table-subtext text-capitalize">{reqType}</div>
                                                    </td>
                                                    <td>
                                                        <strong>{request.document_type?.document_name || "Unknown"}</strong>
                                                        {idImage && (
                                                            <div className="data-table-subtext">
                                                                <strong>Valid ID:</strong>{" "}
                                                                <a className="data-table-link" href={getValidIdImageUrl(idImage)} target="_blank" rel="noreferrer">View uploaded ID</a>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td><StatusBadge status={request.status} /></td>
                                                    <td>
                                                        <div><strong>Purpose:</strong> {request.purpose || "—"}</div>
                                                        {request.remarks && <div className="data-table-subtext"><strong>Remarks:</strong> {request.remarks}</div>}
                                                    </td>
                                                    <td>{formatDate(request.created_at)}</td>
                                                    <td>
                                                        <div className="data-table-actions">
                                                            <Button
                                                                type="button"
                                                                className="btn btn-outline-success btn-sm"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/admin/requests/${reqType}/${reqId}`,
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
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
