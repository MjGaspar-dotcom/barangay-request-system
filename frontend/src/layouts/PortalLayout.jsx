<<<<<<< Updated upstream
<<<<<<< Updated upstream
import {
    PortalBackground,
    PortalBrand,
    PortalBrandName,
    PortalBrandSubtitle,
    PortalBrandText,
    PortalContent,
    PortalFooter,
    PortalHeader,
    PortalHeaderLabel,
    PortalLogo,
    PortalMain,
    PortalPage,
} from "./PortalLayout.styles";
=======
=======
>>>>>>> Stashed changes
import BrandMark from "../components/ui/BrandMark";
import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

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

function PortalLayout({
    children,
    portalLabel = "BARANGAY ONLINE SERVICES",
    sidebarItems,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hasSidebar = Boolean(sidebarItems?.length);
>>>>>>> Stashed changes

function PortalLayout({ children, portalLabel = "BARANGAY ONLINE SERVICES" }) {
    return (
        <PortalPage>
            <PortalBackground aria-hidden="true" />

            <PortalContent>
                <PortalHeader>
                    <PortalBrand to="/">
                        <PortalLogo>B</PortalLogo>

<<<<<<< Updated upstream
                        <PortalBrandText>
                            <PortalBrandName>Barangay System</PortalBrandName>

                            <PortalBrandSubtitle>
                                Document Services
                            </PortalBrandSubtitle>
                        </PortalBrandText>
                    </PortalBrand>
=======
                <div
                    className={`portal-content ${
                        hasSidebar ? "portal-dashboard-main" : ""
                    }`}
                >
                    {!hasSidebar && (
                        <header className="portal-header">
                            <Link to="/" className="portal-brand">
                                <BrandMark className="portal-logo" />

                                <div className="portal-brand-text">
                                    <span className="portal-brand-name">
                                        Barangay Aurora
                                    </span>
>>>>>>> Stashed changes

                    <PortalHeaderLabel>{portalLabel}</PortalHeaderLabel>
                </PortalHeader>

                <PortalMain>{children}</PortalMain>

<<<<<<< Updated upstream
                <PortalFooter>
                    <span>
                        Barangay Document Request System with Automated ID Verification and Receipt QR Validation
                    </span>
=======
                    {hasSidebar && (
                        <div className="portal-menu-control">
                            {portalLabel === "ADMINISTRATION" && (
                                <span className="portal-menu-label">MENU</span>
                            )}
                            <button
                                type="button"
                                className="portal-menu-button"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open navigation"
                                aria-expanded={sidebarOpen}
                            >
                                <i className="bi bi-list" aria-hidden="true" />
                            </button>
                        </div>
                    )}
>>>>>>> Stashed changes

                    <span>© 2026</span>
                </PortalFooter>
            </PortalContent>
        </PortalPage>
    );
}

export default PortalLayout;
