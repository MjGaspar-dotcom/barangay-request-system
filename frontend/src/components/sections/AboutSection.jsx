import {
    SectionContainer,
    SectionDescription,
    SectionHeading,
    SectionLabel,
    SectionTitle,
} from "./Section.styles";
import { AboutGrid, AboutSectionRoot, InfoCard } from "./AboutSection.styles";

function AboutSection() {
    return (
        <AboutSectionRoot id="about">
            <SectionContainer>
                <SectionHeading>
                    <SectionLabel>ABOUT THE SYSTEM</SectionLabel>

                    <SectionTitle>
                        Integrated Barangay Document Services
                    </SectionTitle>

                    <SectionDescription>
                        The Integrated Barangay Document Request, Processing,
                        and Analytics System provides a centralized platform for
                        requesting and processing barangay documents.
                    </SectionDescription>
                </SectionHeading>

                <AboutGrid>
                    <InfoCard>
                        <h3>Request Online</h3>

                        <p>
                            Residents can submit document requests without
                            having to manually complete the entire process at
                            the barangay office.
                        </p>
                    </InfoCard>

                    <InfoCard>
                        <h3>Track Requests</h3>

                        <p>
                            Each request receives a tracking number so users can
                            monitor its processing status.
                        </p>
                    </InfoCard>

                    <InfoCard>
                        <h3>Data Analytics</h3>

                        <p>
                            Barangay personnel can use collected request data to
                            monitor activity and support data-driven
                            decision-making.
                        </p>
                    </InfoCard>
                </AboutGrid>
            </SectionContainer>
        </AboutSectionRoot>
    );
}

export default AboutSection;
