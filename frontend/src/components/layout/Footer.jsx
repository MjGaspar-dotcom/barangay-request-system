import {
    FooterBottom,
    FooterBrand,
    FooterContainer,
    FooterContent,
    FooterCopyright,
    FooterInfo,
    FooterRoot,
} from "./Footer.styles";

export default function Footer() {
    return (
        <FooterRoot>
            <FooterContainer>
                <FooterContent>
                    <FooterBrand>
                        <h3>Barangay Document System</h3>

                        <p>
                            An integrated system for requesting, processing,
                            tracking, and analyzing barangay documents.
                        </p>
                    </FooterBrand>

                    <FooterInfo>
                        <h4>Barangay Office</h4>

                        <p>San Juan, Ilocos Sur</p>

                        <p>Office Hours: Monday–Friday, 8:00 AM–5:00 PM</p>
                    </FooterInfo>
                </FooterContent>

                <FooterBottom>
                    <FooterCopyright>
                        © 2026 Integrated Barangay Document Request, Processing,
                        and Analytics System
                    </FooterCopyright>
                </FooterBottom>
            </FooterContainer>
        </FooterRoot>
    );
}
