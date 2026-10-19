import { useNavigate } from "react-router-dom";
import PortalLayout from "../../layouts/PortalLayout";

function Landing() {
    const navigate = useNavigate();

    return (
        <PortalLayout portalLabel="STAFF & ADMINISTRATION">
            <section className="portal-hero staff-admin-landing">
                <span className="portal-eyebrow">BARANGAY SYSTEM ACCESS</span>

                <h1>
                    Staff &amp; Admin
                    <span> Portal</span>
                </h1>

                <p className="staff-admin-description">
                    Sign in to process document requests, manage barangay
                    services, and oversee system operations.
                </p>

                <div className="staff-admin-options">
                    <button
                        type="button"
                        className="staff-admin-option"
                        onClick={() => navigate("/staff/login")}
                    >
                        <span className="staff-admin-option-icon" aria-hidden="true">
                            <i className="bi bi-person-badge" />
                        </span>
                        <span className="staff-admin-option-content">
                            <span className="staff-admin-option-title">
                                Barangay Staff
                            </span>
                            <span className="staff-admin-option-description">
                                Review and process document requests.
                            </span>
                            <span className="staff-admin-option-action">
                                Continue to Staff Login
<<<<<<< HEAD
                                <span aria-hidden="true"> →</span>
=======
                                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="staff-admin-option"
                        onClick={() => navigate("/admin/login")}
                    >
                        <span className="staff-admin-option-icon" aria-hidden="true">
                            <i className="bi bi-shield-lock" />
                        </span>
                        <span className="staff-admin-option-content">
                            <span className="staff-admin-option-title">
                                Administrator
                            </span>
                            <span className="staff-admin-option-description">
                                Manage staff, requests, and system settings.
                            </span>
                            <span className="staff-admin-option-action">
                                Continue to Admin Login
<<<<<<< HEAD
                                <span aria-hidden="true"> →</span>
=======
                                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                            </span>
                        </span>
                    </button>
                </div>
            </section>
        </PortalLayout>
    );
}

export default Landing;
