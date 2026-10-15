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
        <NavbarRoot>
            <MobileNavbarContainer>
                <NavbarBrand to="/" onClick={closeMobileMenu}>
                    <NavbarLogo>B</NavbarLogo>

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
                >
                    {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </MobileMenuButton>
            </MobileNavbarContainer>

            <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
        </NavbarRoot>
    );
}

export default Navbar;
