import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 10;

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
                canonicalRequestStatus(request.status) !== statusFilter
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
                                                        status={request.status}
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
