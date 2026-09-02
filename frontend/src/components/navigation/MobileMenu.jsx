import { Link } from "react-router-dom";
import NavLinks from "./NavLinks";

function MobileMenu({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="mobile-menu">
            <NavLinks onLinkClick={onClose} />

            <div className="mobile-menu-actions">
                <Link to="/login" onClick={onClose} className="login-link">
                    Login
                </Link>

                <Link
                    to="/register"
                    onClick={onClose}
                    className="register-button"
                >
                    Register
                </Link>
            </div>
        </div>
    );
}

export default MobileMenu;
