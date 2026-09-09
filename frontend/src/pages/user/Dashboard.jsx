import { Link } from "react-router-dom";
import PortalLayout from "../../layouts/PortalLayout";
import { useAuth } from "../../hooks/useAuth";

/*
|--------------------------------------------------------------------------
| Resident Landing Page
|--------------------------------------------------------------------------
| This is the main landing page for authenticated residents/users.
|
| Residents can:
| - Request a new barangay document
| - View their existing requests
| - Track request progress
| - Access their account
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();

    /*
     * Use the user's first name when available.
     * Fall back to "Resident" if the backend does not provide it.
     */
    const residentName =
        user?.first_name || user?.firstName || user?.name || "Resident";

    return (
        <PortalLayout portalLabel="RESIDENT SERVICES">
            <section className="resident-portal">
                {/* -------------------------------------------------------
                    Welcome Section
                ------------------------------------------------------- */}
                <div className="resident-welcome">
                    <span className="portal-eyebrow">RESIDENT PORTAL</span>

                    <h1>
                        Welcome, <span>{residentName}</span>
                    </h1>

                    <p>
                        Access your barangay document services, submit requests,
                        and monitor their progress in one place.
                    </p>
                </div>

                {/* -------------------------------------------------------
                    Main Actions
                ------------------------------------------------------- */}
                <div className="resident-actions">
                    <Link
                        to="/request"
                        className="resident-action-card resident-action-primary"
                    >
                        <div className="resident-action-icon">+</div>

                        <div className="resident-action-content">
                            <span className="resident-action-title">
                                Request a Document
                            </span>

                            <span className="resident-action-description">
                                Submit a new barangay document request.
                            </span>
                        </div>

                        <span className="resident-action-arrow">→</span>
                    </Link>

                    <Link to="/requests" className="resident-action-card">
                        <div className="resident-action-icon">≡</div>

                        <div className="resident-action-content">
                            <span className="resident-action-title">
                                My Requests
                            </span>

                            <span className="resident-action-description">
                                View and monitor your submitted requests.
                            </span>
                        </div>

                        <span className="resident-action-arrow">→</span>
                    </Link>
                </div>

                {/* -------------------------------------------------------
                    Service Information
                ------------------------------------------------------- */}
                <div className="resident-service-card">
                    <div className="resident-service-header">
                        <div>
                            <span className="resident-section-label">
                                DOCUMENT SERVICES
                            </span>

                            <h2>Manage your requests</h2>
                        </div>

                        <span className="resident-service-status">ONLINE</span>
                    </div>

                    <div className="resident-service-steps">
                        <div className="resident-step">
                            <span className="resident-step-number">01</span>

                            <div>
                                <strong>Submit</strong>
                                <p>
                                    Choose the document you need and submit your
                                    request.
                                </p>
                            </div>
                        </div>

                        <div className="resident-step-line"></div>

                        <div className="resident-step">
                            <span className="resident-step-number">02</span>

                            <div>
                                <strong>Track</strong>
                                <p>
                                    Monitor the processing status of your
                                    request.
                                </p>
                            </div>
                        </div>

                        <div className="resident-step-line"></div>

                        <div className="resident-step">
                            <span className="resident-step-number">03</span>

                            <div>
                                <strong>Receive</strong>
                                <p>
                                    Follow the instructions for receiving your
                                    document.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Account Link
                ------------------------------------------------------- */}
                <div className="resident-account-link">
                    <span>Need to update your account information?</span>

                    <Link to="/profile">View Profile</Link>
                </div>
            </section>
        </PortalLayout>
    );
}

export default Dashboard;
