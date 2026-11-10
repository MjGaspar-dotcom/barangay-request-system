import Icon from "../../components/ui/Icon.jsx";
import { useEffect, useMemo, useState } from "react";
import { Table } from "../../components/ui/table";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import StatusBadge from "../../components/ui/StatusBadge";

const STATUS_FILTERS = [
    { value: "all", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Additional Requirements", label: "Additional Requirements" },
    { value: "Approved", label: "Approved" },
    { value: "Processing", label: "Processing" },
    { value: "Ready for Pickup", label: "Ready" },
    { value: "Completed", label: "Completed" },
    { value: "Rejected", label: "Rejected" },
];

const PAGE_SIZE = 10;

export default function ManageRequests() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        let active = true;
        api.get("/staff/requests")
            .then((response) => {
                if (!active) return;
                setRequests(response.data.data || []);
                setError("");
            })
            .catch((requestError) => {
                console.error(requestError);
                if (active) setError("Failed to load requests.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

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
                (request.status || "").toLowerCase() !==
                    statusFilter.toLowerCase()
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

    const counts = useMemo(() => {
        const result = {
            total: requests.length,
            pending: 0,
            additionalRequirements: 0,
            approved: 0,
            processing: 0,
            ready: 0,
            completed: 0,
            rejected: 0,
        };

        requests.forEach((req) => {
            const s = (req.status || "").toLowerCase();
            if (s === "pending") result.pending++;
            else if (s === "additional requirements") result.additionalRequirements++;
            else if (s === "approved") result.approved++;
            else if (s === "processing") result.processing++;
            else if (s === "ready for pickup") result.ready++;
            else if (s === "completed") result.completed++;
            else if (s === "rejected") result.rejected++;
        });

        return result;
    }, [requests]);

    const statCards = [
        { label: "Total", value: counts.total },
        { label: "Pending", value: counts.pending },
        {
            label: "Additional Requirements",
            value: counts.additionalRequirements,
        },
        { label: "Approved", value: counts.approved },
        { label: "Processing", value: counts.processing },
        { label: "Ready", value: counts.ready },
        { label: "Completed", value: counts.completed },
        { label: "Rejected", value: counts.rejected },
    ];

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    if (loading) {
        return (
            <AdminLayout>
                <SkeletonLoader label="Loading requests" variant="table" />
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-loading">
                    <div className="app-alert app-alert-danger" role="alert">{error}</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-dashboard manage-requests-page">
                <div className="w-full">
                    <div className="dashboard-page-header">
                        <div>
                            <span className="section-label">
                                REQUEST MANAGEMENT
                            </span>

                            <h1>Manage Requests</h1>

                            <p>
                                Review every document request submitted by
                                registered residents. Open
                                a request to review its details and manage its
                                status.
                            </p>
                        </div>
                    </div>

                    <section className="dashboard-section">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {statCards.map((stat) => (
                                <div
                                    className="sm:col-span-6 md:col-span-4 xl:col-span-3"
                                    key={stat.label}
                                >
                                    <div className="dashboard-stat-card">
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
                                className="app-input filter-search-380"
                                placeholder="Search by tracking number, name, document, purpose..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value)
                                    setPage(1);
                                }}
                                
                            />

                            <select
                                className="app-select filter-select-180"
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value)
                                    setPage(1);
                                }}
                                
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

                            <div className="filter-count"
                                
                            >
                                Showing{" "}
                                {filtered.length === 0
                                    ? "0"
                                    : `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                                          currentPage * PAGE_SIZE,
                                          filtered.length,
                                      )}`}{" "}
                                of {filtered.length} matching request
                                {filtered.length === 1 ? "" : "s"} ({requests.length} total)
                            </div>
                        </div>
                    </section>

                    <section className="dashboard-section">
                        {filtered.length === 0 ? (
                            <div className="dashboard-empty-state">
                                <div className="dashboard-empty-icon" aria-hidden="true">
                                    <Icon name="inbox" />
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
                                        {pageRequests.map((request) => {
                                            const reqId = request.request_id;

                                            return (
                                                <tr key={reqId}>
                                                    <td>
                                                        <strong>{getRequesterName(request)}</strong>
                                                        <div className="data-table-subtext">{request.tracking_number}</div>
                                                    </td>
                                                    <td>
                                                        <strong>{request.document_type?.document_name || "Unknown"}</strong>
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
                                                                className="app-button app-button-outline-success app-button-sm"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/admin/requests/${reqId}`,
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
            </div>
        </AdminLayout>
    );
}
