import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import { Chip } from "@mui/material";
import ActionCard from "../../components/ui/ActionCard";
import PageHeader from "../../components/ui/PageHeader";
import PortalWorkspace from "../../components/ui/PortalWorkspace";
import SectionCard from "../../components/ui/SectionCard";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
import {
    ResidentAccount,
    ResidentAccountLink,
    ResidentActions,
    ResidentPortal,
    ResidentServiceSteps,
    ResidentStep,
    ResidentStepLine,
    ResidentStepNumber,
} from "./Dashboard.styles";

function Dashboard() {
    const { user } = useAuth();

    const residentName =
        user?.first_name || user?.firstName || user?.name || "Resident";

    return (
        <PortalLayout portalLabel="RESIDENT SERVICES">
            <ResidentPortal>
                <PortalWorkspace>
                    <PageHeader
                        eyebrow="Resident Portal"
                        title={
                            <>
                                Welcome, <strong>{residentName}</strong>
                            </>
                        }
                        description="Access your barangay document services, submit requests, and monitor their progress in one place."
                    />

                    <ResidentActions>
                        <ActionCard
                            to="/request"
                            icon={<AddRoundedIcon />}
                            title="Request a Document"
                            description="Submit a new barangay document request."
                            emphasis
                        />

                        <ActionCard
                            to="/requests"
                            icon={<ListAltRoundedIcon />}
                            title="My Requests"
                            description="View and monitor your submitted requests."
                        />
                    </ResidentActions>

                    <SectionCard
                        eyebrow="Document Services"
                        title="How requests work"
                        action={
                            <Chip
                                label="Online"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        }
                    >
                        <ResidentServiceSteps>
                            <ResidentStep>
                                <ResidentStepNumber>01</ResidentStepNumber>

                                <div>
                                    <strong>Submit</strong>

                                    <p>
                                        Choose the document you need and submit
                                        your request.
                                    </p>
                                </div>
                            </ResidentStep>

                            <ResidentStepLine />

                            <ResidentStep>
                                <ResidentStepNumber>02</ResidentStepNumber>

                                <div>
                                    <strong>Track</strong>

                                    <p>
                                        Monitor the processing status of your
                                        request.
                                    </p>
                                </div>
                            </ResidentStep>

                            <ResidentStepLine />

                            <ResidentStep>
                                <ResidentStepNumber>03</ResidentStepNumber>

                                <div>
                                    <strong>Receive</strong>

                                    <p>
                                        Follow the instructions for receiving
                                        your document.
                                    </p>
                                </div>
                            </ResidentStep>
                        </ResidentServiceSteps>
                    </SectionCard>

                    <ResidentAccount>
                        <span>Need to update your account information?</span>

                        <ResidentAccountLink to="/profile">
                            View Profile
                        </ResidentAccountLink>
                    </ResidentAccount>
                </PortalWorkspace>
            </ResidentPortal>
        </PortalLayout>
    );
}

export default Dashboard;
