import { useEffect, useState } from "react";
import {
    Button,
    CircularProgress,
    TextField,
} from "@mui/material";
import api from "../../services/api";
import {
    EmailOtpActions,
    EmailOtpDescription,
    EmailOtpError,
    EmailOtpRoot,
    EmailOtpStatus,
    EmailOtpVerified,
} from "./EmailOtpVerification.styles";

const EMAIL_OTP_SEND_ENDPOINT = "/otp/send";
const EMAIL_OTP_VERIFY_ENDPOINT = "/otp/verify";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailOtpVerification({
    email,
    purpose,
    idPrefix,
    onVerificationChange,
}) {
    const [otp, setOtp] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [resendSeconds, setResendSeconds] = useState(0);

    const normalizedEmail = email.trim().toLowerCase();
    const emailIsValid = EMAIL_PATTERN.test(normalizedEmail);

    useEffect(() => {
        setOtp("");
        setCodeSent(false);
        setVerifiedEmail("");
        setStatusMessage("");
        setErrorMessage("");
        setResendSeconds(0);

        onVerificationChange({
            email: "",
            token: "",
        });
    }, [normalizedEmail, onVerificationChange]);

    useEffect(() => {
        if (resendSeconds <= 0) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [resendSeconds]);

    const sendOtp = async () => {
        if (!normalizedEmail) {
            setErrorMessage("Enter your email address before requesting a code.");
            return;
        }

        if (!emailIsValid) {
            setErrorMessage("Enter a valid email address before requesting a code.");
            return;
        }

        setSending(true);
        setErrorMessage("");
        setStatusMessage("");

        try {
            const response = await api.post(EMAIL_OTP_SEND_ENDPOINT, {
                channel: "email",
                email: normalizedEmail,
                purpose,
            });

            setCodeSent(true);
            setOtp("");
            setResendSeconds(RESEND_COOLDOWN_SECONDS);
            setStatusMessage(
                response.data?.message ||
                    "A 6-digit verification code was sent to your email.",
            );
        } catch (error) {
            console.error("Email OTP send failed:", error);

            if (error.response?.status === 429) {
                setErrorMessage(
                    error.response.data?.message ||
                        "Too many verification requests. Please wait before trying again.",
                );
            } else {
                setErrorMessage(
                    error.response?.data?.message ||
                        "Unable to send the verification code. Please try again.",
                );
            }
        } finally {
            setSending(false);
        }
    };

    const verifyOtp = async () => {
        if (!OTP_PATTERN.test(otp)) {
            setErrorMessage("Enter the 6-digit code sent to your email.");
            return;
        }

        setVerifying(true);
        setErrorMessage("");

        try {
            const response = await api.post(EMAIL_OTP_VERIFY_ENDPOINT, {
                channel: "email",
                email: normalizedEmail,
                otp,
                purpose,
            });

            const result = response.data;
            const verificationToken = result?.verification_token;

            if (result?.verified !== true || !verificationToken) {
                setErrorMessage(
                    result?.message ||
                        "The verification code is invalid or has expired.",
                );
                return;
            }

            setVerifiedEmail(normalizedEmail);
            setStatusMessage(
                result.message || "Email address verified successfully.",
            );

            onVerificationChange({
                email: normalizedEmail,
                token: verificationToken,
            });
        } catch (error) {
            console.error("Email OTP verification failed:", error);

            setErrorMessage(
                error.response?.data?.message ||
                    "The verification code is invalid or has expired.",
            );
        } finally {
            setVerifying(false);
        }
    };

    const isVerified =
        Boolean(verifiedEmail) && verifiedEmail === normalizedEmail;

    return (
        <EmailOtpRoot>
            <EmailOtpDescription>
                Verify this email with a one-time code. No SMS verification is
                required.
            </EmailOtpDescription>

            {!isVerified && (
                <EmailOtpActions>
                    <Button
                        type="button"
                        variant="outlined"
                        onClick={sendOtp}
                        disabled={
                            sending ||
                            verifying ||
                            !emailIsValid ||
                            resendSeconds > 0
                        }
                    >
                        {sending && (
                            <CircularProgress size={18} color="inherit" />
                        )}

                        {sending
                            ? "Sending..."
                            : resendSeconds > 0
                              ? `Resend in ${resendSeconds}s`
                              : codeSent
                                ? "Resend Code"
                                : "Send Verification Code"}
                    </Button>

                    {codeSent && (
                        <>
                            <TextField
                                id={`${idPrefix}-otp`}
                                type="text"
                                fullWidth
                                label="Email OTP"
                                value={otp}
                                onChange={(event) => {
                                    const digits = event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6);

                                    setOtp(digits);
                                    setErrorMessage("");
                                }}
                                placeholder="Enter 6-digit code"
                                disabled={sending || verifying}
                                slotProps={{
                                    htmlInput: {
                                        inputMode: "numeric",
                                        autoComplete: "one-time-code",
                                        maxLength: 6,
                                        "aria-describedby": errorMessage
                                            ? `${idPrefix}-otp-error`
                                            : undefined,
                                    },
                                }}
                            />

                            <Button
                                type="button"
                                variant="contained"
                                onClick={verifyOtp}
                                disabled={
                                    sending ||
                                    verifying ||
                                    !OTP_PATTERN.test(otp)
                                }
                            >
                                {verifying && (
                                    <CircularProgress
                                        size={18}
                                        color="inherit"
                                    />
                                )}

                                {verifying
                                    ? "Verifying..."
                                    : "Verify Email"}
                            </Button>
                        </>
                    )}
                </EmailOtpActions>
            )}

            {statusMessage && !isVerified && (
                <EmailOtpStatus
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {statusMessage}
                </EmailOtpStatus>
            )}

            {isVerified && (
                <EmailOtpVerified
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    <strong>Email verified</strong>
                    <span>{normalizedEmail}</span>
                </EmailOtpVerified>
            )}

            {errorMessage && (
                <EmailOtpError
                    id={`${idPrefix}-otp-error`}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage}
                </EmailOtpError>
            )}
        </EmailOtpRoot>
    );
}
