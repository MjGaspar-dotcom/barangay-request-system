import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ArrowBackRounded,
    CameraAltRounded,
    CheckRounded,
    RefreshRounded,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import {
    useNavigate,
    useOutletContext,
} from "react-router-dom";
import {
    ScannerActionButton,
    ScannerActions,
    ScannerBackButton,
    ScannerCameraVideo,
    ScannerContent,
    ScannerError,
    ScannerFrame,
    ScannerFrameCorners,
    ScannerHeader,
    ScannerHeaderCopy,
    ScannerHeaderTitle,
    ScannerInstruction,
    ScannerLoading,
    ScannerReviewImage,
    ScannerRoot,
    ScannerScanLine,
    ScannerStatus,
    ScannerStatusDot,
    ScannerTips,
    ScannerViewport,
} from "./IDScanner.styles";

const ID_CARD_ASPECT_RATIO = 1.586;
const MAX_CAPTURE_WIDTH = 1600;

export default function IDScanner() {
    const navigate = useNavigate();
    const { setCapturedIdResult } = useOutletContext();

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraLoading, setCameraLoading] = useState(true);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [capturing, setCapturing] = useState(false);
    const [capturedFile, setCapturedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => {
            track.stop();
        });

        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraReady(false);
    }, []);

    const startCamera = useCallback(async () => {
        stopCamera();

        setCameraLoading(true);
        setCameraReady(false);
        setCameraError("");

        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError(
                "Camera access is unavailable. Return to the request form and upload an ID photo instead.",
            );
            setCameraLoading(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment",
                    },
                    width: {
                        ideal: 1920,
                    },
                    height: {
                        ideal: 1080,
                    },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error(err);

            setCameraError(
                "Unable to open the camera. Allow camera permission, then try again. You can also return and upload a photo.",
            );
            setCameraLoading(false);
        }
    }, [stopCamera]);

    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, [startCamera, stopCamera]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleBack = () => {
        stopCamera();
        navigate("/request");
    };

    const handleCapture = () => {
        const video = videoRef.current;

        if (
            !video ||
            !cameraReady ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            setCameraError(
                "The camera is still preparing. Wait a moment, then try again.",
            );
            return;
        }

        setCapturing(true);
        setCameraError("");

        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        const sourceAspectRatio = sourceWidth / sourceHeight;

        let cropX = 0;
        let cropY = 0;
        let cropWidth = sourceWidth;
        let cropHeight = sourceHeight;

        if (sourceAspectRatio > ID_CARD_ASPECT_RATIO) {
            cropWidth = sourceHeight * ID_CARD_ASPECT_RATIO;
            cropX = (sourceWidth - cropWidth) / 2;
        } else {
            cropHeight = sourceWidth / ID_CARD_ASPECT_RATIO;
            cropY = (sourceHeight - cropHeight) / 2;
        }

        const outputWidth = Math.min(
            MAX_CAPTURE_WIDTH,
            Math.floor(cropWidth),
        );
        const outputHeight = Math.round(
            outputWidth / ID_CARD_ASPECT_RATIO,
        );

        const canvas = document.createElement("canvas");

        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            setCameraError(
                "Unable to prepare the ID image. Please try again.",
            );
            setCapturing(false);
            return;
        }

        context.drawImage(
            video,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            outputWidth,
            outputHeight,
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setCameraError(
                        "Unable to capture the ID image. Please try again.",
                    );
                    setCapturing(false);
                    return;
                }

                const file = new File(
                    [blob],
                    `scanned-valid-id-${Date.now()}.jpg`,
                    {
                        type: "image/jpeg",
                    },
                );

                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }

                setCapturedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
                setCapturing(false);
                stopCamera();
            },
            "image/jpeg",
            0.9,
        );
    };

    const handleRetake = async () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setCapturedFile(null);
        setPreviewUrl("");
        setCameraError("");

        await startCamera();
    };

    const handleUsePhoto = () => {
        if (!capturedFile) {
            return;
        }

        setCapturedIdResult({
            file: capturedFile,
            capturedAt: Date.now(),
        });

        navigate("/request");
    };

    return (
        <ScannerRoot>
            <ScannerHeader>
                <ScannerBackButton
                    type="button"
                    onClick={handleBack}
                    aria-label="Back to document request"
                >
                    <ArrowBackRounded />
                </ScannerBackButton>

                <ScannerHeaderCopy>
                    <ScannerHeaderTitle>Scan Valid ID</ScannerHeaderTitle>
                    <span>Identity verification</span>
                </ScannerHeaderCopy>
            </ScannerHeader>

            <ScannerContent>
                <ScannerInstruction>
                    {capturedFile
                        ? "Review the captured ID before using it."
                        : "Place the entire ID inside the frame. Keep all four corners visible and the text clear."}
                </ScannerInstruction>

                <ScannerViewport>
                    {capturedFile && previewUrl ? (
                        <ScannerReviewImage
                            src={previewUrl}
                            alt="Captured valid ID preview"
                        />
                    ) : (
                        <>
                            <ScannerCameraVideo
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                onCanPlay={() => {
                                    setCameraLoading(false);
                                    setCameraReady(true);
                                }}
                            />

                            <ScannerFrame aria-hidden="true">
                                <ScannerFrameCorners>
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                </ScannerFrameCorners>

                                {cameraReady && <ScannerScanLine />}
                            </ScannerFrame>

                            {cameraLoading && !cameraError && (
                                <ScannerLoading>
                                    <CircularProgress
                                        size={30}
                                        color="inherit"
                                    />
                                    <span>Opening camera...</span>
                                </ScannerLoading>
                            )}
                        </>
                    )}
                </ScannerViewport>

                {!capturedFile && !cameraError && (
                    <ScannerStatus>
                        <ScannerStatusDot />
                        <span>
                            Align your ID with the frame before capturing.
                        </span>
                    </ScannerStatus>
                )}

                {cameraError && (
                    <ScannerError
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {cameraError}
                    </ScannerError>
                )}

                <ScannerTips>
                    <strong>For a clear scan</strong>
                    <span>Use good lighting and avoid glare or shadows.</span>
                    <span>Keep the ID flat and hold your phone steady.</span>
                    <span>Make sure names, numbers, and the photo are readable.</span>
                </ScannerTips>

                <ScannerActions>
                    {capturedFile ? (
                        <>
                            <ScannerActionButton
                                type="button"
                                variant="outlined"
                                startIcon={<RefreshRounded />}
                                onClick={handleRetake}
                            >
                                Retake
                            </ScannerActionButton>

                            <ScannerActionButton
                                type="button"
                                variant="contained"
                                startIcon={<CheckRounded />}
                                onClick={handleUsePhoto}
                            >
                                Use ID Photo
                            </ScannerActionButton>
                        </>
                    ) : (
                        <ScannerActionButton
                            type="button"
                            variant="contained"
                            startIcon={<CameraAltRounded />}
                            onClick={handleCapture}
                            disabled={
                                !cameraReady ||
                                cameraLoading ||
                                Boolean(cameraError) ||
                                capturing
                            }
                        >
                            {capturing ? "Capturing..." : "Capture ID"}
                        </ScannerActionButton>
                    )}
                </ScannerActions>
            </ScannerContent>
        </ScannerRoot>
    );
}
