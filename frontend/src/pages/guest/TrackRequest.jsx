import { useState } from "react";
import {
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableRow,
    TextField,
} from "@mui/material";
import { useForm } from "react-hook-form";
import FieldValidationError from "../../components/forms/FieldValidationError";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import api from "../../services/api";
import {
    GuestBackHomeLink,
    GuestPageCard,
    GuestPageContainer,
    GuestPageRoot,
} from "./GuestPage.styles";
import {
    TrackingNumberValue,
    TrackLabelCell,
    TrackRequestField,
    TrackRequestForm,
    TrackResult,
    TrackResultTitle,
    TrackTableContainer,
    TrackValueCell,
} from "./TrackRequest.styles";

import { validateForm } from "../../utils/validateForm";
export default function TrackRequest() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [requestError, setRequestError] = useState("");

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm({
        defaultValues: {
            tracking_number: "",
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

<<<<<<< Updated upstream
    const trackingNumberField = register("tracking_number", {
        validate: (value) =>
            value.trim() !== "" || "Tracking number is required.",
    });

    const handleTrack = async (values) => {
        setRequestError("");
=======
        if (!validateForm(e.currentTarget)) return;

        if (!validateForm(e.currentTarget)) return;

        setError("");
>>>>>>> Stashed changes
        setResult(null);
        setLoading(true);

        try {
            const response = await api.get(
                `/guest-requests/track/${values.tracking_number.trim()}`,
            );

            setResult(response.data.data);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 404) {
                setError("tracking_number", {
                    type: "server",
                    message:
                        "No request found with that tracking number. Please check and try again.",
                });
            } else {
                setRequestError(
                    "Unable to look up the tracking number. Please try again.",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestPageRoot>
            <GuestPageContainer>
                <GuestBackHomeLink to="/">
                    ← Back to Home
                </GuestBackHomeLink>

                <PageHeader
                    align="center"
                    eyebrow="Request Tracking"
                    title="Track Your Request"
                    description="Enter the tracking number you received when your request was submitted."
                />

                <GuestPageCard>
                    <TrackRequestForm
                        onSubmit={handleSubmit(handleTrack)}
                        noValidate
                    >
                        <TrackRequestField>
                            <TextField
                                id="tracking_number"
                                name={trackingNumberField.name}
                                type="text"
                                fullWidth
                                required
                                label="Tracking Number"
                                placeholder="Example: GR-20260902-ABCDEF"
                                onChange={trackingNumberField.onChange}
                                onBlur={trackingNumberField.onBlur}
                                inputRef={trackingNumberField.ref}
                                error={Boolean(errors.tracking_number)}
                                slotProps={{
                                    htmlInput: {
                                        "aria-invalid": Boolean(
                                            errors.tracking_number,
                                        ),
                                        "aria-describedby":
                                            errors.tracking_number
                                                ? "tracking-number-error"
                                                : undefined,
                                    },
                                }}
                            />

                            <FieldValidationError
                                id="tracking-number-error"
                                error={errors.tracking_number}
                            />
                        </TrackRequestField>

                        {requestError && (
                            <FieldValidationError
                                id="tracking-request-error"
                                error={requestError}
                            />
                        )}

<<<<<<< Updated upstream
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                    Searching...
                                </>
                            ) : (
                                "Track Request"
=======
                        <div className="card-body">

                            <form noValidate onSubmit={handleTrack}>

                                <label
                                    htmlFor="tracking_number"
                                    className="form-label"
                                >
                                    Enter Tracking Number
                                </label>

                                <input
                                    id="tracking_number"
                                    type="text"
                                    className="form-control mb-3"
                                    placeholder="Example: GR-20260902-ABCDEF"
                                    value={trackingNumber}
                                    onChange={(e) =>
                                        setTrackingNumber(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Searching..." : "Track Request"}
                                </button>

                            </form>

                            {/* Error */}
                            {error && (
                                <p className="text-danger mt-3">{error}</p>
>>>>>>> Stashed changes
                            )}
                        </Button>
                    </TrackRequestForm>

                    {result && (
                        <TrackResult>
                            <TrackResultTitle>Request Status</TrackResultTitle>

                            <TrackTableContainer>
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TrackLabelCell>
                                                Tracking Number
                                            </TrackLabelCell>

                                            <TrackValueCell>
                                                <TrackingNumberValue>
                                                    {result.tracking_number}
                                                </TrackingNumberValue>
                                            </TrackValueCell>
                                        </TableRow>

                                        <TableRow>
                                            <TrackLabelCell>
                                                Document
                                            </TrackLabelCell>

                                            <TrackValueCell>
                                                {result.document}
                                            </TrackValueCell>
                                        </TableRow>

                                        <TableRow>
                                            <TrackLabelCell>
                                                Status
                                            </TrackLabelCell>

                                            <TrackValueCell>
                                                <StatusBadge
                                                    status={result.status}
                                                />
                                            </TrackValueCell>
                                        </TableRow>

                                        <TableRow>
                                            <TrackLabelCell>
                                                Purpose
                                            </TrackLabelCell>

                                            <TrackValueCell>
                                                {result.purpose}
                                            </TrackValueCell>
                                        </TableRow>

                                        <TableRow>
                                            <TrackLabelCell>
                                                Submitted
                                            </TrackLabelCell>

                                            <TrackValueCell>
                                                {new Date(
                                                    result.submitted_at,
                                                ).toLocaleString()}
                                            </TrackValueCell>
                                        </TableRow>

                                        {result.remarks && (
                                            <TableRow>
                                                <TrackLabelCell>
                                                    Remarks
                                                </TrackLabelCell>

                                                <TrackValueCell>
                                                    {result.remarks}
                                                </TrackValueCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TrackTableContainer>
                        </TrackResult>
                    )}
                </GuestPageCard>
            </GuestPageContainer>
        </GuestPageRoot>
    );
}
