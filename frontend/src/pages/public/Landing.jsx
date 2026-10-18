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

<<<<<<< Updated upstream
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
=======
                <div className="staff-admin-options">
                    <button
                        type="button"
                        className="staff-admin-option"
                        onClick={() => navigate("/staff/login")}
                    >
                        <span className="staff-admin-option-icon" aria-hidden="true">
                            <i className="bi bi-person-badge" />
                        </span>
                        <span className="staff-admin-option-content">
                            <span className="staff-admin-option-title">
                                Barangay Staff
                            </span>
                            <span className="staff-admin-option-description">
                                Review and process document requests.
                            </span>
                            <span className="staff-admin-option-action">
                                Continue to Staff Login
                                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="staff-admin-option"
                        onClick={() => navigate("/admin/login")}
                    >
                        <span className="staff-admin-option-icon" aria-hidden="true">
                            <i className="bi bi-shield-lock" />
                        </span>
                        <span className="staff-admin-option-content">
                            <span className="staff-admin-option-title">
                                Administrator
                            </span>
                            <span className="staff-admin-option-description">
                                Manage staff, requests, and system settings.
                            </span>
                            <span className="staff-admin-option-action">
                                Continue to Admin Login
                                <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                            </span>
                        </span>
                    </button>
                </div>
            </section>
>>>>>>> Stashed changes
        </PortalLayout>
    );
}

export default Landing;
