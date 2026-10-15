import {
    SectionContainer,
    SectionDescription,
    SectionHeading,
    SectionLabel,
    SectionTitle,
} from "./Section.styles";
import {
    ContactCard,
    ContactGrid,
    ContactSectionRoot,
} from "./ContactSection.styles";

function ContactSection() {
    return (
        <ContactSectionRoot id="contact">
            <SectionContainer>
                <SectionHeading>
                    <SectionLabel>CONTACT</SectionLabel>

                    <SectionTitle>Barangay Office</SectionTitle>

                    <SectionDescription>
                        For concerns regarding document requests, processing, or
                        other barangay services, contact the barangay office.
                    </SectionDescription>
                </SectionHeading>

                <ContactGrid>
                    <ContactCard>
                        <h3>Address</h3>

                        <p>
                            Barangay Hall
                            <br />
                            San Juan, Ilocos Sur
                        </p>
                    </ContactCard>

                    <ContactCard>
                        <h3>Contact Number</h3>

                        <p>Contact the barangay office for assistance.</p>
                    </ContactCard>

                    <ContactCard>
                        <h3>Office Hours</h3>

                        <p>
                            Monday–Friday
                            <br />
                            8:00 AM–5:00 PM
                        </p>
                    </ContactCard>
                </ContactGrid>
            </SectionContainer>
        </ContactSectionRoot>
    );
}

export default ContactSection;
