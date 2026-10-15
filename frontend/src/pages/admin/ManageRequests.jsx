import { useEffect, useMemo, useState } from "react";
import { Alert, Button, CircularProgress, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../layouts/AdminLayout";
import StatusBadge from "../../components/ui/StatusBadge";
import {
    AdminEmptyIcon,
    AdminEmptyState,
    AdminFilterBar,
    AdminFilterField,
    AdminMessages,
    AdminPage,
    AdminPageHeader,
    AdminPageLabel,
    AdminPageState,
    AdminResultsCount,
    AdminSearchField,
    AdminSection,
} from "../../components/admin/AdminCrud.styles";
import {
    RequestActions,
    RequestCard,
    RequestCardContent,
    RequestCardHeader,
    RequestIdLink,
    RequestIdRow,
    RequestList,
    RequestMeta,
    RequestPurpose,
    RequestRemarks,
    RequesterName,
    RequestStatCard,
    RequestStatContent,
    RequestStatIcon,
    RequestStatLabel,
    RequestStatsGrid,
    RequestStatValue,
    RequestSubmitted,
    RequestTypeIcon,
    RequestTypeText,
} from "./ManageRequests.styles";

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
            `Change status of ${request.tracking_number} to "${newStatus}"?`,
        );

        if (!confirmAction) return;

        const endpoint =
            request.request_type === "guest"
                ? `/guest-requests/${request.request_id}`
                : `/barangay-requests/${request.request_id}`;

        try {
            setBusyId(`${request.request_type}-${request.request_id}`);

            await api.put(endpoint, {
                status: newStatus,
            });

            flash(
                `Request ${request.tracking_number} updated to ${newStatus}.`,
            );

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
            `Permanently delete ${request.tracking_number}? This cannot be undone.`,
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

                if (!haystack.includes(needle)) {
                    return false;
                }
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
            const status = (req.status || "").toLowerCase();

            if (status === "pending") {
                result.pending++;
            } else if (status === "approved") {
                result.approved++;
            } else if (status === "processing") {
                result.processing++;
            } else if (status === "ready for pickup") {
                result.ready++;
            } else if (status === "completed") {
                result.completed++;
            } else if (status === "rejected") {
                result.rejected++;
            }
        });

        return result;
    }, [requests]);

    const statCards = [
        {
            label: "Total",
            value: counts.total,
            type: "total",
        },
        {
            label: "Pending",
            value: counts.pending,
            type: "pending",
        },
        {
            label: "Approved",
            value: counts.approved,
            type: "approved",
        },
        {
            label: "Processing",
            value: counts.processing,
            type: "processing",
        },
        {
            label: "Ready",
            value: counts.ready,
            type: "ready",
        },
        {
            label: "Completed",
            value: counts.completed,
            type: "completed",
        },
        {
            label: "Rejected",
            value: counts.rejected,
            type: "rejected",
        },
    ];

    const getValidIdImageUrl = (path) => {
        if (!path) return null;

        if (path.startsWith("http")) {
            return path;
        }

        return `http://127.0.0.1:8000/storage/${path}`;
    };

    const formatDate = (value) =>
        value ? new Date(value).toLocaleString() : "—";

    if (loading) {
        return (
            <AdminLayout>
                <AdminPageState>
                    <CircularProgress color="success" size={32} />

                    <p>Loading requests...</p>
                </AdminPageState>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <AdminPageState>
                    <Alert severity="error">{error}</Alert>
                </AdminPageState>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminPage>
                <AdminPageHeader>
                    <AdminPageLabel>REQUEST MANAGEMENT</AdminPageLabel>

                    <h1>Manage Requests</h1>

                    <p>
                        Review every document request submitted by registered
                        residents and walk-in guests. Approve, reject, or
                        advance each request through the processing pipeline.
                    </p>
                </AdminPageHeader>

                <AdminSection>
                    <RequestStatsGrid>
                        {statCards.map((stat) => (
                            <RequestStatCard key={stat.label}>
                                <RequestStatIcon statType={stat.type}>
                                    {stat.label[0]}
                                </RequestStatIcon>

                                <RequestStatContent>
                                    <RequestStatLabel>
                                        {stat.label}
                                    </RequestStatLabel>

                                    <RequestStatValue>
                                        {stat.value}
                                    </RequestStatValue>
                                </RequestStatContent>
                            </RequestStatCard>
                        ))}
                    </RequestStatsGrid>
                </AdminSection>

                {(actionMessage || actionError) && (
                    <AdminMessages>
                        {actionMessage && (
                            <Alert severity="success">{actionMessage}</Alert>
                        )}

                        {actionError && (
                            <Alert severity="error">{actionError}</Alert>
                        )}
                    </AdminMessages>
                )}

                <AdminSection>
                    <AdminFilterBar>
                        <AdminSearchField
                            type="search"
                            size="small"
                            label="Search Requests"
                            placeholder="Search by tracking number, name, document, purpose..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <AdminFilterField
                            select
                            size="small"
                            label="Status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                        >
                            {STATUS_FILTERS.map((filter) => (
                                <MenuItem
                                    key={filter.value}
                                    value={filter.value}
                                >
                                    {filter.label}
                                </MenuItem>
                            ))}
                        </AdminFilterField>

                        <AdminFilterField
                            select
                            size="small"
                            label="Type"
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(event.target.value)
                            }
                        >
                            {TYPE_FILTERS.map((filter) => (
                                <MenuItem
                                    key={filter.value}
                                    value={filter.value}
                                >
                                    {filter.label}
                                </MenuItem>
                            ))}
                        </AdminFilterField>

                        <AdminResultsCount>
                            Showing {filtered.length} of {requests.length}{" "}
                            request
                            {requests.length === 1 ? "" : "s"}
                        </AdminResultsCount>
                    </AdminFilterBar>
                </AdminSection>

                <AdminSection>
                    {filtered.length === 0 ? (
                        <AdminEmptyState>
                            <AdminEmptyIcon>📋</AdminEmptyIcon>

                            <h3>No Requests Found</h3>

                            <p>
                                No document requests match your current filters.
                                Try clearing the filters to see all requests.
                            </p>
                        </AdminEmptyState>
                    ) : (
                        <RequestList>
                            {filtered.map((request) => {
                                const reqId =
                                    request.request_id ||
                                    request.guest_request_id;

                                const reqType =
                                    request.request_type || "registered";

                                const isBusy = busyId === `${reqType}-${reqId}`;

                                const idImage = request.guest?.valid_id_image;

                                return (
                                    <RequestCard key={`${reqType}-${reqId}`}>
                                        <RequestTypeIcon requestType={reqType}>
                                            {reqType === "registered"
                                                ? "👤"
                                                : "🧑"}
                                        </RequestTypeIcon>

                                        <RequestCardContent>
                                            <RequestCardHeader>
                                                <div>
                                                    <RequesterName>
                                                        {getRequesterName(
                                                            request,
                                                        )}
                                                    </RequesterName>

                                                    <RequestMeta>
                                                        <strong>
                                                            {
                                                                request.tracking_number
                                                            }
                                                        </strong>
                                                        {" • "}
                                                        <RequestTypeText>
                                                            {reqType}
                                                        </RequestTypeText>
                                                        {" • "}
                                                        {request.document_type
                                                            ?.document_name ||
                                                            "Unknown"}
                                                    </RequestMeta>
                                                </div>

                                                <StatusBadge
                                                    status={request.status}
                                                />
                                            </RequestCardHeader>

                                            <RequestPurpose>
                                                <strong>Purpose:</strong>{" "}
                                                {request.purpose || "—"}
                                            </RequestPurpose>

                                            {request.remarks && (
                                                <RequestRemarks>
                                                    <strong>Remarks:</strong>{" "}
                                                    {request.remarks}
                                                </RequestRemarks>
                                            )}

                                            {idImage && (
                                                <RequestIdRow>
                                                    <strong>Valid ID:</strong>{" "}
                                                    <RequestIdLink
                                                        href={getValidIdImageUrl(
                                                            idImage,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        View uploaded ID
                                                    </RequestIdLink>
                                                </RequestIdRow>
                                            )}

                                            <RequestSubmitted>
                                                Submitted:{" "}
                                                {formatDate(request.created_at)}
                                            </RequestSubmitted>

                                            <RequestActions>
                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    color="success"
                                                    size="small"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/requests/${reqType}/${reqId}`,
                                                        )
                                                    }
                                                >
                                                    View Details
                                                </Button>

                                                {request.status ===
                                                    "Pending" && (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="contained"
                                                            color="success"
                                                            size="small"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                handleStatusUpdate(
                                                                    request,
                                                                    "Approved",
                                                                )
                                                            }
                                                        >
                                                            Approve
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="contained"
                                                            color="error"
                                                            size="small"
                                                            disabled={isBusy}
                                                            onClick={() =>
                                                                handleStatusUpdate(
                                                                    request,
                                                                    "Rejected",
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}

                                                {request.status ===
                                                    "Approved" && (
                                                    <Button
                                                        type="button"
                                                        variant="contained"
                                                        size="small"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                request,
                                                                "Processing",
                                                            )
                                                        }
                                                    >
                                                        Start Processing
                                                    </Button>
                                                )}

                                                {request.status ===
                                                    "Processing" && (
                                                    <Button
                                                        type="button"
                                                        variant="contained"
                                                        color="info"
                                                        size="small"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                request,
                                                                "Ready for Pickup",
                                                            )
                                                        }
                                                    >
                                                        Ready for Pickup
                                                    </Button>
                                                )}

                                                {request.status ===
                                                    "Ready for Pickup" && (
                                                    <Button
                                                        type="button"
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        disabled={isBusy}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                request,
                                                                "Completed",
                                                            )
                                                        }
                                                    >
                                                        Mark Completed
                                                    </Button>
                                                )}

                                                <Button
                                                    type="button"
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        handleDelete(request)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </RequestActions>
                                        </RequestCardContent>
                                    </RequestCard>
                                );
                            })}
                        </RequestList>
                    )}
                </AdminSection>
            </AdminPage>
        </AdminLayout>
    );
}
