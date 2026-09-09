import { Link } from "react-router-dom";
import PortalLayout from "../../layouts/PortalLayout";

/*
|--------------------------------------------------------------------------
| Guest Landing Page
|--------------------------------------------------------------------------
| This is the public entry point of the system.
|
| Guests can:
| - Request a barangay document
| - Track an existing request
| - Sign in to an existing account
| - Register for an account
|--------------------------------------------------------------------------
*/

function Landing() {
    return (
        <PortalLayout portalLabel="GUEST SERVICES">
            <section className="portal-hero guest-portal-hero">
                {/* Small section identifier */}
                <span className="portal-eyebrow">
                    BARANGAY ONLINE SERVICES
                </span>

                {/* Main page heading */}
                <h1>
                    Barangay Document
                    <span> Services</span>
                </h1>

                {/* Short description */}
                <p className="guest-hero-description">
                    Request and track your barangay documents through a
                    simple and accessible online service.
                </p>

                {/* Main actions */}
                <div className="portal-actions">
                    <Link
                        to="/request"
                        className="portal-button-primary"
                    >
                        Request a Document
                    </Link>

                    <Link
                        to="/track-request"
                        className="portal-button-secondary"
                    >
                        Track My Request
                    </Link>
                </div>

                {/* Quick service information */}
                <div className="guest-quick-info">
                    <div className="guest-info-item">
                        <span className="guest-info-number">
                            01
                        </span>

                        <div>
                            <span className="guest-info-title">
                                Request
                            </span>

                            <span className="guest-info-text">
                                Submit a document request
                            </span>
                        </div>
                    </div>

                    <div className="guest-info-divider"></div>

                    <div className="guest-info-item">
                        <span className="guest-info-number">
                            02
                        </span>

                        <div>
                            <span className="guest-info-title">
                                Track
                            </span>

                            <span className="guest-info-text">
                                Check your request status
                            </span>
                        </div>
                    </div>

                    <div className="guest-info-divider"></div>

                    <div className="guest-info-item">
                        <span className="guest-info-number">
                            03
                        </span>

                        <div>
                            <span className="guest-info-title">
                                Receive
                            </span>

                            <span className="guest-info-text">
                                Follow your document progress
                            </span>
                        </div>
                    </div>
                </div>

                {/* Account option */}
                <div className="guest-account-action">
                    <span>Already have an account?</span>

                    <Link to="/login">
                        Sign in
                    </Link>

                    <span className="guest-account-separator">
                        or
                    </span>

                    <Link to="/register">
                        Register
                    </Link>
                </div>
            </section>
        </PortalLayout>
    );
}

export default Landing;