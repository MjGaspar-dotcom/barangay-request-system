import { useState } from "react";
import { Link } from "react-router-dom";

import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import BrandMark from "../ui/BrandMark";

function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                    <BrandMark
                        className="navbar-logo"
                        alt="Barangay Aurora, Alicia, Isabela seal"
                    />
                    <div className="navbar-title">
                        <span className="barangay-name">Barangay Aurora</span>
                        <span className="system-name">BarangayEase</span>
                    </div>
                </Link>
                <div className="desktop-navigation">
                    <NavLinks />
                </div>
                <div className="navbar-actions">
                    <Link to="/login" className="login-link">
                        Login
                    </Link>

                    <Link to="/register" className="register-button">
                        Register
                    </Link>
                </div>
                <button
                    type="button"
                    className="mobile-menu-button"
                    onClick={toggleMobileMenu}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation-menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        </header>
    );
}

export default Navbar;
