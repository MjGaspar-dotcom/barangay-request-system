import { useCallback, useEffect, useState } from "react";
<<<<<<< HEAD
import { Link } from "react-router-dom";
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
=======
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import { useAuth } from "../../hooks/useAuth";
import StaffLayout from "../../layouts/StaffLayout";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
import api from "../../services/api";
import StatusBadge from "../../components/ui/StatusBadge";

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
    const [refreshKey, setRefreshKey] = useState(0);
<<<<<<< HEAD
    const navigationItems = [
        { label: "Dashboard", to: "/staff/dashboard", icon: "▦" },
        { label: "All Requests", to: "/staff/requests", icon: "📋" },
    ];
=======
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

    /*
     * Display the staff member's name when available.
     * Fall back to "Staff" when the backend does not provide a name.
     */
    const staffName =
<<<<<<< HEAD
        user?.first_name ||
        user?.firstName ||
        user?.name ||
        "Staff";
=======
        user?.first_name || user?.firstName || user?.name || "Staff";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

    const fetchRequests = useCallback(async () => {
        const response = await api.get("/staff/requests");
        const requestData = response.data?.data;

        if (!Array.isArray(requestData)) {
            throw new Error("Unexpected staff requests response.");
        }

        return requestData;
    }, []);

    useEffect(() => {
        let active = true;

        const loadRequests = async () => {
            try {
                const requestData = await fetchRequests();
                if (active) {
                    setRequests(requestData);
                }
            } catch (fetchError) {
                console.error(
                    "Failed to load staff dashboard requests:",
<<<<<<< HEAD
                    fetchError
=======
                    fetchError,
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                );
                if (active) {
                    setError("Failed to load requests. Please try again.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadRequests();

        return () => {
            active = false;
        };
    }, [fetchRequests, refreshKey]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRefreshKey((current) => current + 1);
    };

    const counts = requests.reduce(
        (result, request) => {
            result.total += 1;
            const status = (request.status || "").toLowerCase();

            if (status === "pending") result.pending += 1;
            if (status === "processing") result.processing += 1;
            if (status === "completed") result.completed += 1;

            return result;
        },
<<<<<<< HEAD
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
=======
        { total: 0, pending: 0, processing: 0, completed: 0 },
    );

    return (
        <StaffLayout>
            <section className="staff-portal staff-dashboard-page">
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={handleRetry}
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
<<<<<<< HEAD
                        <span className="portal-eyebrow">
                            STAFF PORTAL
                        </span>
=======
                        <span className="portal-eyebrow">STAFF PORTAL</span>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

                        <h1>
                            Welcome, <span>{staffName}</span>
                        </h1>

                        <p>
<<<<<<< HEAD
                            Manage barangay document requests and
                            monitor their processing status.
=======
                            Manage barangay document requests and monitor their
                            processing status.
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
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
<<<<<<< HEAD
                            <span className="staff-stat-label">
                                PENDING
                            </span>
=======
                            <span className="staff-stat-label">PENDING</span>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.pending}
                            </span>
                        </div>

<<<<<<< HEAD
                        <p>
                            Requests waiting for processing
                        </p>
=======
                        <p>Requests waiting for processing</p>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
<<<<<<< HEAD
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
                            <>
                                <div className="staff-request-list">
                                    {requests.slice(0, 8).map((request) => (
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
                                            <StatusBadge
                                                status={request.status}
                                                size="sm"
                                            />
                                        </Link>
                                    ))}
                                </div>
                                {requests.length > 8 && (
                                    <Link
                                        to="/staff/requests"
                                        className="staff-view-all-link"
                                    >
                                        View all {requests.length} requests →
                                    </Link>
                                )}
                            </>
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

                <NotificationCenter />
            </section>
        </PortalLayout>
    );
}

export default Dashboard;
=======
                            <span className="staff-stat-label">PROCESSING</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.processing}
                            </span>
                        </div>

                        <p>Requests currently being handled</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">COMPLETED</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.completed}
                            </span>
                        </div>

                        <p>Requests completed by the office</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">TOTAL</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.total}
                            </span>
                        </div>

                        <p>Total requests in the system</p>
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Work Area
                ------------------------------------------------------- */}
                <div className="staff-work-grid staff-dashboard-work-grid">
                    {/* Processing Guide */}
                    <div className="staff-work-card">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    WORKFLOW
                                </span>

                                <h2>Processing Steps</h2>
                            </div>
                        </div>

                        <div className="staff-workflow staff-dashboard-workflow">
                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    01
                                </span>

                                <div>
                                    <strong>Review</strong>

                                    <p>Check submitted request information.</p>
                                </div>
                            </div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    02
                                </span>

                                <div>
                                    <strong>Process</strong>

                                    <p>
                                        Verify and process the requested
                                        document.
                                    </p>
                                </div>
                            </div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    03
                                </span>

                                <div>
                                    <strong>Complete</strong>

                                    <p>
                                        Update the request once processing is
                                        finished.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <NotificationCenter />
            </section>
        </StaffLayout>
    );
}

export default Dashboard;
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
