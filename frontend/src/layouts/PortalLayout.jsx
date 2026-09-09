import { Link } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Shared Portal Layout
|--------------------------------------------------------------------------
| All four portal landing pages use this layout:
|
| 1. Guest
| 2. Resident / User
| 3. Staff
| 4. Administrator
|
| The barangay photograph is placed in a separate background layer.
| This allows us to control the image opacity without affecting
| the text, buttons, cards, or other content.
|--------------------------------------------------------------------------
*/

function PortalLayout({ children, portalLabel = "BARANGAY ONLINE SERVICES" }) {
    return (
        <div className="portal-page">
            {/* 
                Background photograph.
                Its opacity is controlled entirely through CSS.
            */}
            <div className="portal-background" aria-hidden="true"></div>

            {/* 
                Main portal content.
                This stays fully visible above the background image.
            */}
            <div className="portal-content">
                <header className="portal-header">
                    <Link to="/" className="portal-brand">
                        <div className="portal-logo">B</div>

                        <div className="portal-brand-text">
                            <span className="portal-brand-name">
                                Barangay System
                            </span>

                            <span className="portal-brand-subtitle">
                                Document Services
                            </span>
                        </div>
                    </Link>

                    <div className="portal-header-label">{portalLabel}</div>
                </header>

                <main className="portal-main">{children}</main>

                <footer className="portal-footer">
                    <span>
                        Integrated Barangay Document Request, Processing, and
                        Analytics System
                    </span>

                    <span>© 2026</span>
                </footer>
            </div>
        </div>
    );
}

export default PortalLayout;
