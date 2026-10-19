import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import StaffLayout from "../../layouts/StaffLayout";
import api from "../../services/api";

const STATUS_FILTERS = [
    "All statuses",
    "Pending",
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
        const response = await api.get("/barangay-requests");
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
            const requester = request.user || request;
            const requesterName =
                [
                    requester?.first_name || requester?.guest_first_name,
                    requester?.last_name || requester?.guest_last_name,
                ]
                    .filter(Boolean)
                    .join(" ") || "Unknown requester";
            const matchesStatus =
                statusFilter === "All statuses" ||
                status === statusFilter.toLowerCase();
            const searchable = [
                request.tracking_number,
                requesterName,
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

    const requesterName = (request) => {
        const requester = request.user || request;
        return (
            [
                requester?.first_name || requester?.guest_first_name,
                requester?.last_name || requester?.guest_last_name,
            ]
                .filter(Boolean)
                .join(" ") || "Unknown requester"
        );
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
    };

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
                    <div className="alert alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
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
                        <label className="visually-hidden" htmlFor="queue-search">
                            Search requests
                        </label>
                        <input
                            id="queue-search"
                            type="search"
                            className="form-control"
                            placeholder="Search tracking number, requester, document..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <label
                            className="visually-hidden"
                            htmlFor="queue-status-filter"
                        >
                            Filter by status
                        </label>
                        <select
                            id="queue-status-filter"
                            className="form-select"
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
                        <div className="staff-queue-empty" role="status">
                            <span
                                className="spinner-border spinner-border-sm text-success"
                                aria-hidden="true"
                            />
                            Loading requests...
                        </div>
                    ) : error ? (
                        <div className="staff-queue-empty">
                            Request records are unavailable.
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="staff-queue-empty">
                            <i
                                className="bi bi-inbox"
                                aria-hidden="true"
                            />
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
                        <DataTable className="staff-queue-table">
                            <thead>
                                <tr>
                                    <th>Tracking Number</th>
                                    <th>Requester</th>
                                    <th>Document</th>
                                    <th>Purpose</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((request) => {
                                    const requestType =
                                        request.request_type ||
                                        (request.user_id ? "registered" : "guest");
                                    const requestId =
                                        request.request_id ||
                                        request.guest_request_id;
                                    return (
                                        <tr
                                            key={`${requestType}-${requestId}`}
                                        >
                                            <td>
                                                <strong>
                                                    {request.tracking_number ||
                                                        "—"}
                                                </strong>
                                            </td>
                                            <td>{requesterName(request)}</td>
                                            <td>
                                                {request.document_type
                                                    ?.document_name ||
                                                    "Document request"}
                                            </td>
                                            <td>{request.purpose || "—"}</td>
                                            <td>
                                                {formatDate(
                                                    request.created_at,
                                                )}
                                            </td>
                                            <td>
                                                <StatusBadge
                                                    status={
                                                        request.status ||
                                                        "Unknown"
                                                    }
                                                    size="sm"
                                                />
                                            </td>
                                            <td>
                                                <Link
                                                    className="staff-queue-view-link"
                                                    to={`/staff/requests/${requestType}/${requestId}`}
                                                >
                                                    View details
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </DataTable>
                    )}
                </section>
            </section>
        </StaffLayout>
    );
}
