import { useState } from "react";
import Button from "../ui/Button";
import api from "../../services/api";

const VALID_ID_TYPES = [
    "Philippine National ID (PhilID)",
    "Driver's License",
    "Passport",
    "UMID",
    "PhilHealth ID",
    "Voter's ID",
    "Postal ID",
    "Senior Citizen ID",
    "Other",
];

export default function GuestApplicantIdVerification({
    requestId,
    requestStatus,
    applicant,
}) {
    const [validIdType, setValidIdType] = useState(
        applicant.valid_id_type || "",
    );
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const canVerify = requestStatus === "request_submitted";

    const saveVerifiedType = async (event) => {
        event.preventDefault();
        setBusy(true);
        setFeedback(null);

        try {
            const response = await api.patch(
                `/barangay-requests/${requestId}/guest-applicant/id-type`,
                { valid_id_type: validIdType },
            );
            setValidIdType(response.data.data.valid_id_type);
            setFeedback({
                message: "ID type saved as part of background verification.",
                type: "success",
            });
        } catch (saveError) {
            console.error(saveError);
            setFeedback({
                message:
                    saveError.response?.data?.message ||
                    "The verified ID type could not be saved.",
                type: "error",
            });
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="admin-form-card staff-detail-card">
            <h2 className="form-section-title">Background Verification</h2>
            <p>
                Review the guest's ID images, then record the ID type shown on
                the document.
            </p>
            <div className="detail-value mb-3 flex flex-wrap gap-3">
                {applicant.valid_id_front_url && (
                    <a
                        href={applicant.valid_id_front_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        View front of ID
                    </a>
                )}
                {applicant.valid_id_back_url && (
                    <a
                        href={applicant.valid_id_back_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        View back of ID
                    </a>
                )}
            </div>
            <form className="flex flex-col gap-3" onSubmit={saveVerifiedType}>
                <label className="app-label" htmlFor={`guest-id-type-${requestId}`}>
                    Verified valid ID type
                </label>
                <select
                    className="app-select"
                    disabled={!canVerify || busy}
                    id={`guest-id-type-${requestId}`}
                    onChange={(event) => setValidIdType(event.target.value)}
                    required
                    value={validIdType}
                >
                    <option value="">Select the type shown on the ID</option>
                    {VALID_ID_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                {canVerify ? (
                    <Button
                        className="app-button app-button-primary"
                        disabled={busy || !validIdType}
                        loading={busy}
                        type="submit"
                    >
                        Save Verified ID Type
                    </Button>
                ) : (
                    <p className="mb-0 text-muted-foreground">
                        ID verification can only be updated while the request
                        is awaiting review.
                    </p>
                )}
                {feedback && (
                    <p
                        className={
                            feedback.type === "success"
                                ? "text-green-700"
                                : "text-danger-token"
                        }
                        role={feedback.type === "error" ? "alert" : "status"}
                    >
                        {feedback.message}
                    </p>
                )}
            </form>
        </section>
    );
}
