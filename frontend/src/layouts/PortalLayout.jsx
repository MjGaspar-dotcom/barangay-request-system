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

function PortalLayout({ children, portalLabel = "BARANGAY ONLINE SERVICES" }) {
    return (
        <PortalPage>
            <PortalBackground aria-hidden="true" />

            <PortalContent>
                <PortalHeader>
                    <PortalBrand to="/">
                        <PortalLogo>B</PortalLogo>

                        <PortalBrandText>
                            <PortalBrandName>Barangay System</PortalBrandName>

                            <PortalBrandSubtitle>
                                Document Services
                            </PortalBrandSubtitle>
                        </PortalBrandText>
                    </PortalBrand>

                    <PortalHeaderLabel>{portalLabel}</PortalHeaderLabel>
                </PortalHeader>

                <PortalMain>{children}</PortalMain>

                <PortalFooter>
                    <span>
                        Barangay Document Request System with Automated ID Verification and Receipt QR Validation
                    </span>

                    <span>© 2026</span>
                </PortalFooter>
            </PortalContent>
        </PortalPage>
    );
}

export default PortalLayout;
