import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import { LoginLink, RegisterLink } from "./navigation.styles";
import {
    BarangayName,
    DesktopNavigation,
    MobileMenuButton,
    MobileNavbarContainer,
    NavbarActions,
    NavbarBrand,
    NavbarLogo,
    NavbarRoot,
    NavbarTitle,
    SystemName,
} from "./Navbar.styles";

function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
<<<<<<< Updated upstream
        <NavbarRoot>
            <MobileNavbarContainer>
                <NavbarBrand to="/" onClick={closeMobileMenu}>
                    <NavbarLogo>B</NavbarLogo>
=======
        <header className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                    <img
                        className="navbar-logo"
                        src="/assets/images/barangay-aurora-logo.png"
                        alt="Barangay Aurora, Alicia, Isabela seal"
                        decoding="async"
                    />
                    <div className="navbar-title">
                        <span className="barangay-name">Barangay Aurora</span>
                        <span className="system-name">
                            Document Request System
                        </span>
                    </div>
                </Link>
                <div className="desktop-navigation">
                    <NavLinks />
                </div>
                <div className="navbar-actions">
                    <Link to="/login" className="login-link">
                        Login
                    </Link>
>>>>>>> Stashed changes

                    <NavbarTitle>
                        <BarangayName>Barangay System</BarangayName>

                        <SystemName>Document Request System</SystemName>
                    </NavbarTitle>
                </NavbarBrand>

                <DesktopNavigation>
                    <NavLinks />
                </DesktopNavigation>

                <NavbarActions>
                    <LoginLink to="/login">Login</LoginLink>

                    <RegisterLink to="/register">Register</RegisterLink>
                </NavbarActions>

                <MobileMenuButton
                    type="button"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation-menu"
                >
                    {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </MobileMenuButton>
            </MobileNavbarContainer>

            <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        </NavbarRoot>
    );
}

export default Navbar;
