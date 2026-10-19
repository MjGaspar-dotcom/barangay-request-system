import { useCallback, useEffect, useState } from "react";
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import { useAuth } from "../../hooks/useAuth";
import StaffLayout from "../../layouts/StaffLayout";
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
    const [refreshKey, setRefreshKey] = useState(0);

    /*
     * Display the staff member's name when available.
     * Fall back to "Staff" when the backend does not provide a name.
     */
    const staffName =
        user?.first_name || user?.firstName || user?.name || "Staff";

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
                    fetchError,
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
        { total: 0, pending: 0, processing: 0, completed: 0 },
    );

    return (
        <StaffLayout>
            <section className="staff-portal staff-dashboard-page">
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
                        <span className="portal-eyebrow">STAFF PORTAL</span>

                        <h1>
                            Welcome, <span>{staffName}</span>
                        </h1>

                        <p>
                            Manage barangay document requests and monitor their
                            processing status.
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
                            <span className="staff-stat-label">PENDING</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.pending}
                            </span>
                        </div>

                        <p>Requests waiting for processing</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
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
