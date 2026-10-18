<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
import { useCallback, useEffect, useState } from "react";
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import { useAuth } from "../../hooks/useAuth";
=======
import { useCallback, useEffect, useState } from "react";
import NotificationCenter from "../../components/dashboard/NotificationCenter";
import { useAuth } from "../../hooks/useAuth";
>>>>>>> Stashed changes
import StaffLayout from "../../layouts/StaffLayout";
import api from "../../services/api";

/*
|--------------------------------------------------------------------------
| Staff Landing Page
|--------------------------------------------------------------------------
| This is the main portal for authenticated barangay staff.
|
| The page is intentionally focused on daily operations:
| - Pending requests
| - Requests being processed
| - Completed requests
| - Overall request workload
|
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

    const staffName =
        user?.first_name || user?.firstName || user?.name || "Staff";

<<<<<<< Updated upstream
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
=======
    const fetchRequests = useCallback(async () => {
        const response = await api.get("/staff/requests");
        const requestData = response.data?.data;

        if (!Array.isArray(requestData)) {
            throw new Error("Unexpected staff requests response.");
        }

        return requestData;
    }, []);

    useEffect(() => {
        let active = true;

        const loadRequests = async () => {
            try {
                const requestData = await fetchRequests();
                if (active) {
                    setRequests(requestData);
                }
            } catch (fetchError) {
                console.error(
                    "Failed to load staff dashboard requests:",
                    fetchError,
                );
                if (active) {
                    setError("Failed to load requests. Please try again.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadRequests();

        return () => {
            active = false;
        };
    }, [fetchRequests, refreshKey]);

    const handleRetry = () => {
        setLoading(true);
        setError("");
        setRefreshKey((current) => current + 1);
    };

    const counts = requests.reduce(
        (result, request) => {
            result.total += 1;
            const status = (request.status || "").toLowerCase();

            if (status === "pending") result.pending += 1;
            if (status === "processing") result.processing += 1;
            if (status === "completed") result.completed += 1;

            return result;
        },
        { total: 0, pending: 0, processing: 0, completed: 0 },
    );

    return (
        <StaffLayout>
            <section className="staff-portal staff-dashboard-page">
                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}{" "}
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={handleRetry}
>>>>>>> Stashed changes
                        >
                            <EmptyState
                                icon={<InboxRoundedIcon />}
                                title="No requests available"
                                description="New document requests will appear here when they are submitted."
                            />
                        </SectionCard>

<<<<<<< Updated upstream
                        <SectionCard
                            eyebrow="Workflow"
                            title="Processing Steps"
                        >
                            <StaffWorkflow>
                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        01
                                    </StaffWorkflowNumber>
=======
                {/* -------------------------------------------------------
                    Welcome Header
                ------------------------------------------------------- */}
                <div className="staff-welcome">
                    <div>
                        <span className="portal-eyebrow">STAFF PORTAL</span>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                                    <div>
                                        <strong>Review</strong>

<<<<<<< Updated upstream
                                        <p>
                                            Check submitted request
                                            information.
                                        </p>
                                    </div>
                                </StaffWorkflowItem>
=======
                        <p>
                            Manage barangay document requests and monitor their
                            processing status.
                        </p>
                    </div>
>>>>>>> Stashed changes

                                <StaffWorkflowLine />

<<<<<<< Updated upstream
                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        02
                                    </StaffWorkflowNumber>
=======
                {/* -------------------------------------------------------
                    Request Overview
                ------------------------------------------------------- */}
                <div className="staff-stat-grid">
                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">PENDING</span>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                                    <div>
                                        <strong>Process</strong>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
                                        <p>
                                            Verify and process the requested
                                            document.
                                        </p>
                                    </div>
                                </StaffWorkflowItem>

                                <StaffWorkflowLine />
=======
=======
>>>>>>> Stashed changes
                        <p>Requests waiting for processing</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">PROCESSING</span>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

                                <StaffWorkflowItem>
                                    <StaffWorkflowNumber>
                                        03
                                    </StaffWorkflowNumber>

<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
=======
>>>>>>> Stashed changes
                        <p>Requests currently being handled</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">COMPLETED</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.completed}
                            </span>
                        </div>

                        <p>Requests completed by the office</p>
                    </div>

                    <div className="staff-stat-card">
                        <div className="staff-stat-top">
                            <span className="staff-stat-label">TOTAL</span>

                            <span className="staff-stat-number">
                                {loading || error ? "—" : counts.total}
                            </span>
                        </div>

                        <p>Total requests in the system</p>
                    </div>
                </div>

                {/* -------------------------------------------------------
                    Work Area
                ------------------------------------------------------- */}
                <div className="staff-work-grid staff-dashboard-work-grid">
                    {/* Processing Guide */}
                    <div className="staff-work-card">
                        <div className="staff-work-header">
                            <div>
                                <span className="staff-section-label">
                                    WORKFLOW
                                </span>

                                <h2>Processing Steps</h2>
                            </div>
                        </div>

                        <div className="staff-workflow staff-dashboard-workflow">
                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    01
                                </span>

                                <div>
                                    <strong>Review</strong>

                                    <p>Check submitted request information.</p>
                                </div>
                            </div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    02
                                </span>

                                <div>
                                    <strong>Process</strong>

                                    <p>
                                        Verify and process the requested
                                        document.
                                    </p>
                                </div>
                            </div>

                            <div className="staff-workflow-item">
                                <span className="staff-workflow-number">
                                    03
                                </span>

                                <div>
                                    <strong>Complete</strong>

                                    <p>
                                        Update the request once processing is
                                        finished.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <NotificationCenter />
            </section>
        </StaffLayout>
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
    );
}

export default Dashboard;
