import { useNavigate } from "react-router-dom";
import RoleCard from "../navigation/RoleCard";
import {
    SectionContainer,
    SectionDescription,
    SectionHeading,
    SectionLabel,
    SectionTitle,
} from "./Section.styles";
import { RoleGrid, RoleSectionRoot } from "./RoleSection.styles";

function RoleSection() {
    const navigate = useNavigate();

    return (
        <RoleSectionRoot>
            <SectionContainer>
                <SectionHeading>
                    <SectionLabel>SYSTEM ACCESS</SectionLabel>

                    <SectionTitle>Choose Your Role</SectionTitle>

                    <SectionDescription>
                        Select the appropriate portal based on how you use the
                        barangay document system.
                    </SectionDescription>
                </SectionHeading>

                <RoleGrid>
                    <RoleCard
                        icon="👤"
                        title="Resident"
                        description="Request and track your barangay documents online."
                        onClick={() => navigate("/login")}
                    />

                    <RoleCard
                        icon="🧑‍💼"
                        title="Barangay Staff"
                        description="Process, review, and manage submitted document requests."
                        onClick={() => navigate("/staff/login")}
                    />

                    <RoleCard
                        icon="⚙️"
                        title="Administrator"
                        description="Manage users, staff, documents, and system operations."
                        onClick={() => navigate("/admin/login")}
                    />
                </RoleGrid>
            </SectionContainer>
        </RoleSectionRoot>
    );
}

export default RoleSection;
