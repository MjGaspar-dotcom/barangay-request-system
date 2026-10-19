import { useNavigate } from "react-router-dom";
import {
    SectionContainer,
    SectionDescription,
    SectionHeading,
    SectionLabel,
    SectionTitle,
} from "./Section.styles";
import {
    DocumentCard,
    DocumentGrid,
    DocumentRequestButton,
    DocumentSectionRoot,
} from "./DocumentSection.styles";

function DocumentSection() {
    const navigate = useNavigate();

    const documents = [
        {
            title: "Barangay Clearance",
            description:
                "A certification commonly required for employment, business, school, and other official transactions.",
        },
        {
            title: "Certificate of Residency",
            description:
                "A document certifying that an individual is a resident of the barangay.",
        },
        {
            title: "Certificate of Indigency",
            description:
                "A certification used to establish an individual's indigency for applicable purposes.",
        },
        {
            title: "Business Clearance",
            description:
                "A barangay-level clearance used as part of business registration and related transactions.",
        },
    ];

    return (
        <DocumentSectionRoot id="services">
            <SectionContainer>
                <SectionHeading>
                    <SectionLabel>DOCUMENT SERVICES</SectionLabel>

                    <SectionTitle>Available Documents</SectionTitle>

                    <SectionDescription>
                        Request common barangay documents through the online
                        document request system.
                    </SectionDescription>
                </SectionHeading>

                <DocumentGrid>
                    {documents.map((document) => (
                        <DocumentCard key={document.title}>
                            <h3>{document.title}</h3>

                            <p>{document.description}</p>

                            <DocumentRequestButton
                                type="button"
                                variant="contained"
                                color="success"
                                onClick={() => navigate("/request")}
                            >
                                Request Now
                            </DocumentRequestButton>
                        </DocumentCard>
                    ))}
                </DocumentGrid>
            </SectionContainer>
        </DocumentSectionRoot>
    );
}

export default DocumentSection;
