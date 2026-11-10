import { useLocation } from "react-router-dom";
import UserRequestForm from "../../components/forms/UserRequestForm";
import PageHeader from "../../components/ui/PageHeader";
import PortalWorkspace from "../../components/ui/PortalWorkspace";
import SectionCard from "../../components/ui/SectionCard";
import PortalLayout from "../../layouts/PortalLayout";
import { ResidentPortal } from "./Dashboard.styles";

export default function Request() {
    const location = useLocation();

    return (
        <PortalLayout portalLabel="RESIDENT SERVICES">
            <ResidentPortal>
                <PortalWorkspace>
                    <PageHeader
                        eyebrow="Resident Portal"
                        title="Request a Document"
                        description="Choose the barangay document you need and submit it for review."
                    />

                    <SectionCard
                        eyebrow="New Request"
                        title="Request details"
                    >
                        <UserRequestForm
                            initialDocument={
                                location.state?.recommendedDocument ?? ""
                            }
                        />
                    </SectionCard>
                </PortalWorkspace>
            </ResidentPortal>
        </PortalLayout>
    );
}
