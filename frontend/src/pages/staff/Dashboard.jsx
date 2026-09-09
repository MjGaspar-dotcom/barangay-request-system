import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";

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
| The actual request data will eventually come from the Laravel API.
| For now, the values below are placeholders until the backend
| endpoints are connected.
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();

    /*
     * Display the staff member's name when available.
     * Fall back to "Staff" when the backend does not provide a name.
     */
    const staffName =
        user?.first_name ||
        user?.firstName ||
        user?.name ||
        "Staff";

    return (
        <PortalLayout portalLabel="STAFF SERVICES">
            <section className="staff-portal">
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
                                0
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
                                0
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
                                0
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
                                0
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
                    <div className="staff-work-card">
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
                                0
                            </span>
                        </div>

                        <div className="staff-empty-state">
                            <div className="staff-empty-icon">
                                ≡
                            </div>

                            <h3>
                                No requests available
                            </h3>

                            <p>
                                New document requests will appear
                                here when they are submitted.
                            </p>
                        </div>
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

                {/* -------------------------------------------------------
                    System Notice
                ------------------------------------------------------- */}
                <div className="staff-notice">
                    <div className="staff-notice-icon">
                        i
                    </div>

                    <div>
                        <strong>
                            Staff workspace
                        </strong>

                        <p>
                            Request counts and queue information will
                            be populated from the Laravel backend once
                            the staff request API is connected.
                        </p>
                    </div>
                </div>
            </section>
        </PortalLayout>
    );
}

export default Dashboard;