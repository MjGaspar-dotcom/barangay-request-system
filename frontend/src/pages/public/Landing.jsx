import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Link } from "react-router-dom";
import PortalLayout from "../../layouts/PortalLayout";
import {
    AdminPortalCard,
    GuestAction,
    GuestActions,
    GuestDescription,
    GuestLogoMark,
    GuestPortalAction,
    GuestPortalCard,
    GuestPortalContent,
    GuestPortalHero,
    GuestServiceIcon,
    GuestServiceText,
    GuestServiceTitle,
    GuestServices,
    GuestTitle,
    GuestWelcome,
    StaffPortalCard,
    UserPortalCard,
} from "./Landing.styles";

/*
|--------------------------------------------------------------------------
| Public Landing Page
|--------------------------------------------------------------------------
| This is the public entry point of the system.
|
| Visitors can:
| - Access guest document services
| - Access the resident / user portal
| - Access the staff portal
| - Access the admin portal
|--------------------------------------------------------------------------
*/

function Landing() {
    return (
        <PortalLayout portalLabel="ONLINE SERVICES">
            <GuestPortalHero>
                <GuestLogoMark>B</GuestLogoMark>

                <GuestWelcome>Welcome to</GuestWelcome>

                <GuestTitle>
                    Barangay Document <span>Services</span>
                </GuestTitle>

                <GuestDescription>
                    Select from our online services.
                </GuestDescription>

                <GuestServices>
                    <GuestPortalCard elevation={0}>
                        <GuestPortalContent>
                            <GuestServiceIcon>
                                <DescriptionOutlinedIcon />
                            </GuestServiceIcon>

                            <GuestServiceTitle>
                                Guest Services
                            </GuestServiceTitle>

                            <GuestServiceText>
                                Request or track barangay documents.
                            </GuestServiceText>

                            <GuestActions>
                                <GuestAction
                                    component={Link}
                                    to="/request"
                                    variant="outlined"
                                    size="small"
                                >
                                    Request Document
                                </GuestAction>

                                <GuestAction
                                    component={Link}
                                    to="/track-request"
                                    variant="outlined"
                                    size="small"
                                >
                                    Track Request
                                </GuestAction>
                            </GuestActions>
                        </GuestPortalContent>
                    </GuestPortalCard>

                    <UserPortalCard elevation={0}>
                        <GuestPortalAction
                            component={Link}
                            to="/login"
                            aria-label="Open User Portal"
                        >
                            <GuestPortalContent>
                                <GuestServiceIcon>
                                    <PersonOutlineOutlinedIcon />
                                </GuestServiceIcon>

                                <GuestServiceTitle>
                                    User Portal
                                </GuestServiceTitle>

                                <GuestServiceText>
                                    Access your account and document requests.
                                </GuestServiceText>
                            </GuestPortalContent>
                        </GuestPortalAction>
                    </UserPortalCard>

                    <StaffPortalCard elevation={0}>
                        <GuestPortalAction
                            component={Link}
                            to="/staff/login"
                            aria-label="Open Staff Portal"
                        >
                            <GuestPortalContent>
                                <GuestServiceIcon>
                                    <BadgeOutlinedIcon />
                                </GuestServiceIcon>

                                <GuestServiceTitle>
                                    Staff Portal
                                </GuestServiceTitle>

                                <GuestServiceText>
                                    Review and process document requests.
                                </GuestServiceText>
                            </GuestPortalContent>
                        </GuestPortalAction>
                    </StaffPortalCard>

                    <AdminPortalCard elevation={0}>
                        <GuestPortalAction
                            component={Link}
                            to="/admin/login"
                            aria-label="Open Admin Portal"
                        >
                            <GuestPortalContent>
                                <GuestServiceIcon>
                                    <AdminPanelSettingsOutlinedIcon />
                                </GuestServiceIcon>

                                <GuestServiceTitle>
                                    Admin Portal
                                </GuestServiceTitle>

                                <GuestServiceText>
                                    Manage users, services, and system records.
                                </GuestServiceText>
                            </GuestPortalContent>
                        </GuestPortalAction>
                    </AdminPortalCard>
                </GuestServices>
            </GuestPortalHero>
        </PortalLayout>
    );
}

export default Landing;
