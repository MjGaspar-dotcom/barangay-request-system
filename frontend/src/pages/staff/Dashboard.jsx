import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import { Alert, Chip } from "@mui/material";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import PortalWorkspace from "../../components/ui/PortalWorkspace";
import SectionCard from "../../components/ui/SectionCard";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
import {
    StaffPortal,
    StaffStatGrid,
    StaffWorkGrid,
    StaffWorkflow,
    StaffWorkflowItem,
    StaffWorkflowLine,
    StaffWorkflowNumber,
} from "./Dashboard.styles";

function Dashboard() {
    const { user } = useAuth();

    const staffName =
        user?.first_name || user?.firstName || user?.name || "Staff";

    return (
        <PortalLayout portalLabel="STAFF SERVICES">
            <StaffPortal>
                <PortalWorkspace>
                    <PageHeader
                        eyebrow="Staff Portal"
                        title={
                            <>
                                Welcome, <strong>{staffName}</strong>
                            </>
                        }
                        description="Manage barangay document requests and monitor their processing status."
                        action={
                            <Chip
                                label="Staff Account"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        }
                    />

                    <StaffStatGrid>
                        <StatCard
                            label="Pending"
                            value="0"
                            description="Requests waiting for processing"
                            icon={<HourglassEmptyRoundedIcon />}
                        />

                        <StatCard
                            label="Processing"
                            value="0"
                            description="Requests currently being handled"
                            icon={<AutorenewRoundedIcon />}
                        />

                        <StatCard
                            label="Completed"
                            value="0"
                            description="Requests completed by the office"
                            icon={<TaskAltRoundedIcon />}
                        />

                        <StatCard
                            label="Total"
                            value="0"
                            description="Total requests in the system"
                            icon={<SummarizeRoundedIcon />}
                        />
                    </StaffStatGrid>

                    <StaffWorkGrid>
                        <SectionCard
                            eyebrow="Request Management"
                            title="Request Queue"
                            action={
                                <Chip
                                    label="0"
                                    color="primary"
                                    size="small"
                                />
                            }
                        >
                            <EmptyState
                                icon={<InboxRoundedIcon />}
                                title="No requests available"
                                description="New document requests will appear here when they are submitted."
                            />
                        </SectionCard>

                        <SectionCard
                            eyebrow="Workflow"
                            title="Processing Steps"
                        >
                            <StaffWorkflow>
                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        01
                                    </StaffWorkflowNumber>

                                    <div>
                                        <strong>Review</strong>

                                        <p>
                                            Check submitted request
                                            information.
                                        </p>
                                    </div>
                                </StaffWorkflowItem>

                                <StaffWorkflowLine />

                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        02
                                    </StaffWorkflowNumber>

                                    <div>
                                        <strong>Process</strong>

                                        <p>
                                            Verify and process the requested
                                            document.
                                        </p>
                                    </div>
                                </StaffWorkflowItem>

                                <StaffWorkflowLine />

                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        03
                                    </StaffWorkflowNumber>

                                    <div>
                                        <strong>Complete</strong>

                                        <p>
                                            Update the request once processing
                                            is finished.
                                        </p>
                                    </div>
                                </StaffWorkflowItem>
                            </StaffWorkflow>
                        </SectionCard>
                    </StaffWorkGrid>

                    <Alert severity="info" variant="outlined">
                        Request counts and queue information will be populated
                        from the backend once the staff request API is
                        connected.
                    </Alert>
                </PortalWorkspace>
            </StaffPortal>
        </PortalLayout>
    );
}

export default Dashboard;
