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
        <MobileMenuRoot>
            <NavLinks isMobile onLinkClick={onClose} />

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
