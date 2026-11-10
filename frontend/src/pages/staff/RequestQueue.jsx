import Icon from "../../components/ui/Icon.jsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
import api from "../../services/api";
import SkeletonLoader from "../../components/ui/SkeletonLoader";

const formatRequesterName = (request) =>
    [request.user?.first_name, request.user?.last_name]
        .filter(Boolean)
        .join(" ") || "Unknown requester";

const formatSubmittedAt = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

const REQUEST_QUEUE_COLUMNS = [
    {
        accessorKey: "tracking_number",
        header: "Tracking Number",
        cell: ({ getValue }) => <strong>{getValue() || "—"}</strong>,
    },
    {
        id: "requester",
        header: "Requester",
        cell: ({ row }) => formatRequesterName(row.original),
    },
    {
        id: "document",
        header: "Document",
        cell: ({ row }) =>
            row.original.document_type?.document_name || "Document request",
    },
    {
        accessorKey: "purpose",
        header: "Purpose",
        cell: ({ getValue }) => getValue() || "—",
    },
    {
        accessorKey: "created_at",
        header: "Submitted",
        cell: ({ getValue }) => formatSubmittedAt(getValue()),
    },
    {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
            <StatusBadge status={row.original.status || "Unknown"} size="sm" />
        ),
    },
    {
        id: "action",
        header: "Action",
        cell: ({ row }) => (
            <Link
                className="staff-queue-view-link"
                to={`/staff/requests/${row.original.request_id}`}
            >
                View details
            </Link>
        ),
    },
];

const STATUS_FILTERS = [
    "All statuses",
    "Pending",
    "Additional Requirements",
    "Approved",
    "Processing",
    "Ready for Pickup",
    "Completed",
    "Rejected",
];

export default function StaffRequestQueue() {
    const [requests, setRequests] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryKey, setRetryKey] = useState(0);

    const fetchRequests = useCallback(async () => {
        const response = await api.get("/staff/requests");
        const data = response.data?.data;
        if (!Array.isArray(data)) {
            throw new Error("Unexpected staff requests response.");
        }
        return data;
    }, []);

    useEffect(() => {
        let active = true;

        const loadRequests = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await fetchRequests();
                if (active) setRequests(data);
            } catch (loadError) {
                console.error("Failed to load staff request queue:", loadError);
                if (active) {
                    setError("Unable to load the request queue. Please try again.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadRequests();
        return () => {
            active = false;
        };
    }, [fetchRequests, retryKey]);

    const filteredRequests = useMemo(() => {
        const term = search.trim().toLowerCase();
        return requests.filter((request) => {
            const status = String(request.status || "").toLowerCase();
            const matchesStatus =
                statusFilter === "All statuses" ||
                status === statusFilter.toLowerCase();
            const searchable = [
                request.tracking_number,
                formatRequesterName(request),
                request.document_type?.document_name,
                request.purpose,
                request.status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesStatus && (!term || searchable.includes(term));
        });
    }, [requests, search, statusFilter]);

    return (
        <StaffLayout>
            <section className="staff-portal staff-request-queue-page">
                <header className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">STAFF PORTAL</span>
                        <h1>Request Queue</h1>
                        <p>
                            Review submitted requests and open a record to
                            continue processing.
                        </p>
                    </div>
                    <span className="staff-status-badge">
                        <span className="staff-status-dot" />
                        {loading ? "LOADING" : `${requests.length} REQUESTS`}
                    </span>
                </header>

                {error && (
                    <div className="app-alert app-alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="app-button app-button-sm app-button-outline-danger ms-2"
                            onClick={() =>
                                setRetryKey((current) => current + 1)
                            }
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="staff-queue-panel">
                    <div className="staff-queue-toolbar">
                        <label className="sr-only" htmlFor="queue-search">
                            Search requests
                        </label>
                        <input
                            id="queue-search"
                            type="search"
                            className="app-input"
                            placeholder="Search tracking number, requester, document..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <label
                            className="sr-only"
                            htmlFor="queue-status-filter"
                        >
                            Filter by status
                        </label>
                        <select
                            id="queue-status-filter"
                            className="app-select"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                        >
                            {STATUS_FILTERS.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <span className="staff-queue-result-count">
                            {loading
                                ? "Loading..."
                                : `${filteredRequests.length} of ${requests.length} requests`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="staff-queue-skeleton">
                            <SkeletonLoader
                                label="Loading requests"
                                variant="table"
                            />
                        </div>
                    ) : error ? (
                        <div className="staff-queue-empty">
                            Request records are unavailable.
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="staff-queue-empty">
                            <Icon name="inbox" />
                            <strong>
                                {requests.length
                                    ? "No matching requests"
                                    : "No requests available"}
                            </strong>
                            <span>
                                {requests.length
                                    ? "Try changing your search or status filter."
                                    : "New requests will appear here when submitted."}
                            </span>
                        </div>
                    ) : (
                        <DataTable
                            className="staff-queue-table"
                            data={filteredRequests}
                            columns={REQUEST_QUEUE_COLUMNS}
                            getRowId={(request) => String(request.request_id)}
                        />
                    )}
                </section>
            </section>
        </StaffLayout>
    );
}
