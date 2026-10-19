import {
    HeroActions,
    HeroContainer,
    HeroDescription,
    HeroGrid,
    HeroLabel,
    HeroPrimaryAction,
    HeroSecondaryAction,
    HeroSectionRoot,
    HeroServiceCard,
    HeroServiceIcon,
    HeroServiceItem,
    HeroServiceList,
    HeroTitle,
} from "./HeroSection.styles";

function HeroSection() {
    return (
        <HeroSectionRoot>
            <HeroContainer>
                <HeroGrid>
                    <div>
                        <HeroLabel>BARANGAY DIGITAL SERVICES</HeroLabel>

                        <HeroTitle>
                            Request Barangay Documents
                            <span> Online</span>
                        </HeroTitle>

                        <HeroDescription>
                            A convenient and centralized platform for
                            requesting, processing, and tracking barangay
                            documents.
                        </HeroDescription>

                        <HeroActions>
                            <HeroPrimaryAction to="/request">
                                Request a Document
                            </HeroPrimaryAction>

                            <HeroSecondaryAction to="/track-request">
                                Track Request
                            </HeroSecondaryAction>
                        </HeroActions>
                    </div>

                    <HeroServiceCard>
                        <HeroServiceIcon>📄</HeroServiceIcon>

                        <h2>Online Document Services</h2>

                        <p>
                            Submit requests and monitor their status through one
                            integrated system.
                        </p>

                        <HeroServiceList>
                            <HeroServiceItem>
                                <span>✓</span>
                                Easy online requests
                            </HeroServiceItem>

                            <HeroServiceItem>
                                <span>✓</span>
                                Request tracking
                            </HeroServiceItem>

                            <HeroServiceItem>
                                <span>✓</span>
                                Organized processing
                            </HeroServiceItem>

                            <HeroServiceItem>
                                <span>✓</span>
                                Centralized records
                            </HeroServiceItem>
                        </HeroServiceList>
                    </HeroServiceCard>
                </HeroGrid>
            </HeroContainer>
        </HeroSectionRoot>
    );
}

export default HeroSection;
