import { Link } from "react-router-dom";

function NavLinks({ onLinkClick }) {
    return (
        <nav className="nav-links">
            {" "}
            <Link to="/" onClick={onLinkClick}>
                Home{" "}
            </Link>
            <Link to="/services" onClick={onLinkClick}>
                Services
            </Link>
            <Link to="/about" onClick={onLinkClick}>
                About
            </Link>
        </nav>
    );
}

export default NavLinks;
