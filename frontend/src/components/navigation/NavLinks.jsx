import { NavigationLink, NavLinksRoot } from "./NavLinks.styles";

function NavLinks({ onLinkClick, isMobile = false }) {
    return (
        <NavLinksRoot isMobile={isMobile}>
            <NavigationLink to="/" onClick={onLinkClick}>
                Home
            </NavigationLink>

            <NavigationLink to="/services" onClick={onLinkClick}>
                Services
            </NavigationLink>

            <NavigationLink to="/about" onClick={onLinkClick}>
                About
            </NavigationLink>
        </NavLinksRoot>
    );
}

export default NavLinks;
