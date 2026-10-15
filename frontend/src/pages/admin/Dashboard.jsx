import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import { Chip } from "@mui/material";
import ActionCard from "../../components/ui/ActionCard";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import PortalWorkspace from "../../components/ui/PortalWorkspace";
import SectionCard from "../../components/ui/SectionCard";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../hooks/useAuth";
import PortalLayout from "../../layouts/PortalLayout";
import {
    AdminAnalyticsContent,
    AdminAnalyticsNote,
    AdminAnalyticsValue,
    AdminBottomGrid,
    AdminManagementGrid,
    AdminOverviewGrid,
    AdminPortal,
} from "./Dashboard.styles";

/*
|--------------------------------------------------------------------------
| Administrator Landing Page
|--------------------------------------------------------------------------
| This is the main landing page for authenticated administrators.
|
| Administrators have a wider view of the system than staff members.
| They can monitor the overall system and access management areas.
|
| The statistics below are placeholders until the dashboard API is connected.
|--------------------------------------------------------------------------
*/

function Dashboard() {
    const { user } = useAuth();

    const adminName =
        user?.first_name || user?.firstName || user?.name || "Administrator";

    return (
        <PortalLayout portalLabel="ADMINISTRATION">
            <AdminPortal>
                <PortalWorkspace>
                    <PageHeader
                        eyebrow="Administrator Portal"
                        title={
                            <>
                                Welcome, <strong>{adminName}</strong>
                            </>
                        }
                        description="Monitor the document request system and manage its users, staff, requests, and services."
                        action={
                            <Chip
                                label="System Online"
                                color="success"
                                size="small"
                                variant="outlined"
                            />
                        }
                    />

                    <AdminOverviewGrid>
                        <StatCard
                            label="Document Requests"
                            value="0"
                            description="Total requests"
                            icon={<AssignmentOutlinedIcon />}
                        />

                        <StatCard
                            label="Users"
                            value="0"
                            description="Registered residents"
                            icon={<PeopleOutlineRoundedIcon />}
                        />

                        <StatCard
                            label="Staff"
                            value="0"
                            description="Active staff accounts"
                            icon={<BadgeOutlinedIcon />}
                        />

                        <StatCard
                            label="Document Types"
                            value="0"
                            description="Available services"
                            icon={<DescriptionOutlinedIcon />}
                        />
                    </AdminOverviewGrid>

                    <SectionCard
                        eyebrow="System Management"
                        title="Administration"
                    >
                        <AdminManagementGrid>
                            <ActionCard
                                to="/admin/users"
                                icon={<PeopleOutlineRoundedIcon />}
                                title="User Management"
                                description="Manage resident accounts and user information."
                            />

                            <ActionCard
                                to="/admin/staff"
                                icon={<BadgeOutlinedIcon />}
                                title="Staff Management"
                                description="Manage staff accounts and access."
                            />

                            <ActionCard
                                to="/admin/requests"
                                icon={<AssignmentOutlinedIcon />}
                                title="Document Requests"
                                description="Review and monitor document requests."
                            />

                            <ActionCard
                                to="/admin/document-types"
                                icon={<DescriptionOutlinedIcon />}
                                title="Document Types"
                                description="Manage available barangay document services."
                            />
                        </AdminManagementGrid>
                    </SectionCard>

                    <AdminBottomGrid>
                        <SectionCard
                            eyebrow="System Activity"
                            title="Recent Activity"
                        >
                            <EmptyState
                                icon={<HistoryRoundedIcon />}
                                title="No recent activity"
                                description="System activity will appear here when users and staff begin using the platform."
                            />
                        </SectionCard>

                        <SectionCard
                            eyebrow="Analytics"
                            title="System Insights"
                        >
                            <AdminAnalyticsContent>
                                <InsightsRoundedIcon />

                                <AdminAnalyticsValue>—</AdminAnalyticsValue>

                                <p>
                                    Analytics will be available once sufficient
                                    request data has been collected.
                                </p>

                                <AdminAnalyticsNote>
                                    Data Science Module
                                </AdminAnalyticsNote>
                            </AdminAnalyticsContent>
                        </SectionCard>
                    </AdminBottomGrid>
                </PortalWorkspace>
            </AdminPortal>
        </PortalLayout>
    );
}

export default Dashboard;
