import { useState } from "react";
import {
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";
import GuestRequestForm from "../../components/forms/GuestRequestForm";
import PageHeader from "../../components/ui/PageHeader";
import {
    GuestBackHomeLink,
    GuestPageCard,
    GuestPageContainer,
    GuestPageRoot,
} from "./GuestPage.styles";

export default function Request() {
    const location = useLocation();
    const navigate = useNavigate();

    const [capturedIdResult, setCapturedIdResult] = useState(null);

    const scannerPageOpen = location.pathname === "/request/id-scan";

    return (
        <>
            <div hidden={scannerPageOpen}>
                <GuestPageRoot>
                    <GuestPageContainer>
                        <GuestBackHomeLink to="/">
                            ← Back to Home
                        </GuestBackHomeLink>

                        <PageHeader
                            align="center"
                            eyebrow="Barangay Service"
                            title="Request Barangay Document"
                            description="Complete the form below to submit your barangay document request."
                        />

                        <GuestPageCard>
                            <GuestRequestForm
                                capturedIdResult={capturedIdResult}
                                onOpenIdScanner={() => navigate("id-scan")}
                            />
                        </GuestPageCard>
                    </GuestPageContainer>
                </GuestPageRoot>
            </div>

            {scannerPageOpen && (
                <Outlet context={{ setCapturedIdResult }} />
            )}
        </>
    );
}
