import { useEffect, useState } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import ProgressBar from "react-bootstrap/ProgressBar";
import Spinner from "react-bootstrap/Spinner";

const RECOMMENDATIONS_API = "/api/recommendations";
const USE_MOCK = true;

const MOCK_RECOMMENDATIONS = [
    {
        document: "Barangay Clearance",
        score: 0.88,
        match_percent: 88,
        reason: "Often requested next after your previous documents",
    },
    {
        document: "Certificate of Residency",
        score: 0.76,
        match_percent: 76,
        reason: "Based on your profile and past requests",
    },
    {
        document: "Barangay ID",
        score: 0.69,
        match_percent: 69,
        reason: "Popular among residents with a similar profile",
    },
];

function ForYouRecommendations({ residentId, onSelectDocument }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [loadedResidentId, setLoadedResidentId] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        let mockTimer;

        if (USE_MOCK) {
            mockTimer = window.setTimeout(() => {
                if (!controller.signal.aborted) {
                    setRecommendations(MOCK_RECOMMENDATIONS);
                    setError("");
                    setLoadedResidentId(residentId);
                    setLoading(false);
                }
            }, 150);
        } else {
            const loadRecommendations = async () => {
                try {
                    const response = await fetch(
                        `${RECOMMENDATIONS_API}/${encodeURIComponent(residentId)}?k=3`,
                        { signal: controller.signal }
                    );

                    if (!response.ok) {
                        throw new Error("Recommendations request failed.");
                    }

                    const data = await response.json();
                    if (!Array.isArray(data?.recommendations)) {
                        throw new Error("Unexpected recommendations response.");
                    }

                    setRecommendations(data.recommendations);
                    setError("");
                    setLoadedResidentId(residentId);
                } catch (requestError) {
                    if (!controller.signal.aborted) {
                        console.error(
                            "Failed to load document recommendations:",
                            requestError
                        );
                        setError("Recommendations could not be loaded.");
                        setLoadedResidentId(residentId);
                    }
                } finally {
                    if (!controller.signal.aborted) {
                        setLoading(false);
                    }
                }
            };

            loadRecommendations();
        }

        return () => {
            controller.abort();
            window.clearTimeout(mockTimer);
        };
    }, [residentId, retryCount]);

    const retry = () => {
        setRecommendations([]);
        setLoading(true);
        setError("");
        setLoadedResidentId(null);
        setRetryCount((current) => current + 1);
    };

    return (
        <section aria-labelledby="for-you-title">
            <header className="mb-3">
                <h2 id="for-you-title" className="h4 mb-1">
                    Recommended for you
                </h2>
                <p className="text-muted mb-0">
                    Based on your profile and past requests
                </p>
            </header>

            {loading || loadedResidentId !== residentId ? (
                <div className="d-flex align-items-center gap-2 py-3">
                    <Spinner
                        animation="border"
                        role="status"
                        aria-label="Loading recommendations"
                        size="sm"
                    />
                    <span>Loading recommendations...</span>
                </div>
            ) : error ? (
                <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
                    <span>{error}</span>
                    <Button type="button" variant="outline-danger" onClick={retry}>
                        Retry
                    </Button>
                </Alert>
            ) : recommendations.length === 0 ? (
                <p className="text-muted">
                    No suggestions yet. Make your first request.
                </p>
            ) : (
                <div className="d-grid gap-3">
                    {recommendations.map((recommendation, index) => {
                        const matchPercent = Math.min(
                            100,
                            Math.max(0, Number(recommendation.match_percent) || 0)
                        );

                        return (
                            <Card key={`${recommendation.document}-${index}`}>
                                <Card.Body>
                                    <div className="d-flex align-items-start gap-3">
                                        <Badge
                                            bg="success"
                                            className="rounded-pill"
                                            aria-label={`Rank ${index + 1}`}
                                        >
                                            #{index + 1}
                                        </Badge>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                                                <Card.Title as="h3" className="h6 mb-0">
                                                    {recommendation.document}
                                                </Card.Title>
                                                <span className="text-nowrap fw-semibold">
                                                    {matchPercent}% match
                                                </span>
                                            </div>
                                            <ProgressBar
                                                now={matchPercent}
                                                min={0}
                                                max={100}
                                                aria-label={`${recommendation.document}: ${matchPercent}% match`}
                                            />
                                            <p className="text-muted small mt-2 mb-3">
                                                {recommendation.reason}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="success"
                                                onClick={() =>
                                                    onSelectDocument?.(
                                                        recommendation.document
                                                    )
                                                }
                                            >
                                                Request this
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default ForYouRecommendations;
