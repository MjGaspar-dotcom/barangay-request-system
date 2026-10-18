import { useAuth } from "../hooks/useAuth";
import AdminLayout from "./AdminLayout";
import PortalLayout from "./PortalLayout";
import { STAFF_NAV_ITEMS } from "./staffNavigation";

/*
 * Every authenticated staff page renders inside this layout so the staff
 * sidebar (teal workspace) is always present, including request details.
 *
 * ProtectedRoute also lets admins open /staff/requests/... links; they keep
 * the admin sidebar instead of seeing a staff one.
 */
function StaffLayout({ children }) {
    const { user } = useAuth();

    if (user?.role === "admin") {
        return <AdminLayout>{children}</AdminLayout>;
    }

    return (
        <PortalLayout
            portalLabel="STAFF SERVICES"
            sidebarItems={STAFF_NAV_ITEMS}
        >
            {children}
        </PortalLayout>
    );
}

export default StaffLayout;
