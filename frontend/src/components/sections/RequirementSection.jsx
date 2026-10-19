import {
    SectionContainer,
    SectionDescription,
    SectionHeading,
    SectionLabel,
    SectionTitle,
} from "./Section.styles";
import {
    RequirementCard,
    RequirementGrid,
    RequirementNumber,
    RequirementSectionRoot,
} from "./RequirementSection.styles";

function RequirementSection() {
    const requirements = [
        {
            title: "Valid Government ID",
            description:
                "Prepare a valid identification document for verification.",
        },
        {
            title: "Proof of Residency",
            description:
                "Provide proof that establishes your residence when required.",
        },
        {
            title: "Complete Information",
            description:
                "Make sure your personal and request information is accurate.",
        },
        {
            title: "Supporting Documents",
            description:
                "Prepare any additional documents required for your request.",
        },
    ];

    return (
        <RequirementSectionRoot>
            <SectionContainer>
                <SectionHeading>
                    <SectionLabel>REQUIREMENTS</SectionLabel>

                    <SectionTitle>Prepare Before You Request</SectionTitle>

                    <SectionDescription>
                        Having the required information and documents ready
                        helps make the request process easier.
                    </SectionDescription>
                </SectionHeading>

                <RequirementGrid>
                    {requirements.map((requirement, index) => (
                        <RequirementCard key={requirement.title}>
                            <RequirementNumber>
                                {String(index + 1).padStart(2, "0")}
                            </RequirementNumber>

                            <div>
                                <h3>{requirement.title}</h3>

                                <p>{requirement.description}</p>
                            </div>
                        </RequirementCard>
                    ))}
                </RequirementGrid>
            </SectionContainer>
        </RequirementSectionRoot>
    );
}

export default RequirementSection;
