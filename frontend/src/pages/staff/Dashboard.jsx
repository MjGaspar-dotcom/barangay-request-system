import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
import api from "../../services/api";

/*
|--------------------------------------------------------------------------
| Staff Landing Page
|--------------------------------------------------------------------------
| This is the main portal for authenticated barangay staff.
|
| The page is intentionally focused on daily operations:
| - Pending requests
| - Requests being processed
| - Completed requests
| - Overall request workload
|
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigationItems = [
        { label: "Dashboard", to: "/staff/dashboard", icon: "▦" },
        {
            label: "Request Queue",
            to: "/staff/dashboard#request-queue",
            icon: "📋",
        },
    ];

    /*
     * Display the staff member's name when available.
     * Fall back to "Staff" when the backend does not provide a name.
     */
    const staffName =
        user?.first_name ||
        user?.firstName ||
        user?.name ||
        "Staff";

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/staff/requests");
            const requestData = response.data?.data;

            if (!Array.isArray(requestData)) {
                throw new Error("Unexpected staff requests response.");
            }

            setRequests(requestData);
        } catch (fetchError) {
            console.error(
                "Failed to load staff dashboard requests:",
                fetchError
            );
            setError("Failed to load requests. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const counts = requests.reduce(
        (result, request) => {
            result.total += 1;
            const status = (request.status || "").toLowerCase();

            if (status === "pending") result.pending += 1;
            if (status === "processing") result.processing += 1;
            if (status === "completed") result.completed += 1;

            return result;
        },
        { total: 0, pending: 0, processing: 0, completed: 0 }
    );

    const requesterName = (request) => {
        const requester =
            request.request_type === "guest"
                ? request.guest || request
                : request.user;
        return (
            [requester?.first_name, requester?.last_name]
                .filter(Boolean)
                .join(" ") || "Unknown requester"
        );
    };

    return (
        <PortalLayout
            portalLabel="STAFF SERVICES"
            sidebarItems={navigationItems}
        >
            <section className="staff-portal">
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={fetchRequests}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* -------------------------------------------------------
                    Welcome Header
                ------------------------------------------------------- */}
                <div className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">
                            STAFF PORTAL
                        </span>

                        <h1>
                            Welcome, <span>{staffName}</span>
                        </h1>

                        <p>
                            Manage barangay document requests and
                            monitor their processing status.
                        </p>
                    </div>

                    <div className="staff-status-badge">
                        <span className="staff-status-dot"></span>
                        STAFF ACCOUNT
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Request Overview
                ------------------------------------------------------- */}
                <div className="staff-stat-grid">
                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">
                                PENDING
                            </span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.pending}
                            </span>
                        </div>

                        <p>
                            Requests waiting for processing
                        </p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">
                                PROCESSING
                            </span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.processing}
                            </span>
                        </div>

                        <p>
                            Requests currently being handled
                        </p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">
                                COMPLETED
                            </span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.completed}
                            </span>
                        </div>

                        <p>
                            Requests completed by the office
                        </p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">
                                TOTAL
                            </span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.total}
                            </span>
                        </div>

                        <p>
                            Total requests in the system
                        </p>
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Work Area
                ------------------------------------------------------- */}
                <div className="staff-work-grid">
                    {/* Request Queue */}
                    <div className="staff-work-card" id="request-queue">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    REQUEST MANAGEMENT
                                </span>

                                <h2>
                                    Request Queue
                                </h2>
                            </div>

                            <span className="staff-work-count">
                                {loading || error ? "—" : requests.length}
                            </span>
                        </div>

                        {error ? (
                            <p className="staff-queue-message">
                                Request queue is unavailable.
                            </p>
                        ) : loading ? (
                            <p className="staff-queue-message">
                                Loading requests...
                            </p>
                        ) : requests.length ? (
                            <div className="staff-request-list">
                                {requests.slice(0, 6).map((request) => (
                                    <Link
                                        className="staff-request-row"
                                        key={`${request.request_type}-${request.request_id}`}
                                        to={`/staff/requests/${request.request_type}/${request.request_id}`}
                                    >
                                        <span className="staff-request-details">
                                            <strong>
                                                {request.tracking_number}
                                            </strong>
                                            <span>
                                                {requesterName(request)} ·{" "}
                                                {request.document_type
                                                    ?.document_name ||
                                                    "Document request"}
                                            </span>
                                        </span>
                                        <span className="staff-request-status">
                                            {request.status || "Unknown"}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="staff-empty-state">
                                <div className="staff-empty-icon">≡</div>
                                <h3>No requests available</h3>
                                <p>
                                    New document requests will appear here
                                    when they are submitted.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Processing Guide */}
                    <div className="staff-work-card">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    WORKFLOW
                                </span>

                                <h2>
                                    Processing Steps
                                </h2>
                            </div>
                        </div>

                        <div className="staff-workflow">
                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    01
                                </span>

                                <div>
                                    <strong>
                                        Review
                                    </strong>

                                    <p>
                                        Check submitted request
                                        information.
                                    </p>
                                </div>
                            </div>

                            <div className="staff-workflow-line"></div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    02
                                </span>

                                <div>
                                    <strong>
                                        Process
                                    </strong>

                                    <p>
                                        Verify and process the
                                        requested document.
                                    </p>
                                </div>
                            </div>

                            <div className="staff-workflow-line"></div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    03
                                </span>

                                <div>
                                    <strong>
                                        Complete
                                    </strong>

                                    <p>
                                        Update the request once
                                        processing is finished.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </PortalLayout>
    );
}

export default Dashboard;