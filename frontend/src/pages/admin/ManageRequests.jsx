import { useEffect, useMemo, useState } from "react";
import Table from "react-bootstrap/Table";
import Button from "../../components/ui/Button";
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
        { label: "Total", value: counts.total, tone: "total" },
        { label: "Pending", value: counts.pending, tone: "pending" },
        { label: "Approved", value: counts.approved, tone: "approved" },
        { label: "Processing", value: counts.processing, tone: "processing" },
        { label: "Ready", value: counts.ready, tone: "ready" },
        { label: "Completed", value: counts.completed, tone: "completed" },
        { label: "Rejected", value: counts.rejected, tone: "rejected" },
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
                    <div className="alert alert-danger" role="alert">{error}</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard manage-requests-page">
                <div className="container-fluid">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                REQUEST MANAGEMENT
                            </span>

                            <h1>Manage Requests</h1>

                            <p>
                                Review every document request submitted by
                                registered residents and walk-in guests. Open
                                a request to review its details and manage its
                                status.
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
                                        <div className={`dashboard-stat-icon dashboard-stat-icon-${stat.tone}`}>

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

                    <section className="dashboard-section">
                        <div
                            className="admin-filters filter-bar filter-row"
                            
                        >
                            <input
                                type="search"
                                className="form-control filter-search-380"
                                placeholder="Search by tracking number, name, document, purpose..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                
                            />

                            <select
                                className="form-select filter-select-180"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                
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
                                className="form-select filter-select-180"
                                value={typeFilter}
                                onChange={(event) =>
                                    setTypeFilter(event.target.value)
                                }
                                
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

                            <div className="filter-count"
                                
                            >
                                Showing {filtered.length} of {requests.length}{" "}
                                request{requests.length === 1 ? "" : "s"}
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <i className="bi bi-inbox" />
                                </div>
                                <h3>No Requests Found</h3>
                                <p>
                                    No document requests match your current
                                    filters. Try clearing the filters to see
                                    all requests.
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
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
