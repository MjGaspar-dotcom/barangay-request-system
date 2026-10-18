import NavLinks from "./NavLinks";
import {
    MobileLoginLink,
    MobileMenuActions,
    MobileMenuRoot,
    MobileRegisterLink,
} from "./MobileMenu.styles";

function MobileMenu({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        <MobileMenuRoot>
            <NavLinks isMobile onLinkClick={onClose} />
=======
=======
>>>>>>> Stashed changes
        <div className="mobile-menu" id="mobile-navigation-menu">
            <NavLinks onLinkClick={onClose} />
>>>>>>> Stashed changes

            <MobileMenuActions>
                <MobileLoginLink to="/login" onClick={onClose}>
                    Login
                </MobileLoginLink>

                <MobileRegisterLink to="/register" onClick={onClose}>
                    Register
                </MobileRegisterLink>
            </MobileMenuActions>
        </MobileMenuRoot>
    );
}

export default MobileMenu;
