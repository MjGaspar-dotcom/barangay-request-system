import { useEffect, useState } from "react";
import Button from "./ui/Button";

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
            <header className="mb-6">
                <h2 id="for-you-title" className="mb-1 text-xl font-semibold">
                    Recommended for you
                </h2>
                <p className="mb-0 text-sm text-muted-foreground">
                    Based on your profile and past requests
                </p>
            </header>

            {loading || loadedResidentId !== residentId ? (
                <div className="flex items-center gap-2 py-4">
                    <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                        role="status"
                        aria-label="Loading recommendations"
                    />
                    <span>Loading recommendations...</span>
                </div>
            ) : error ? (
                <div
                    className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                    role="alert"
                >
                    <span>{error}</span>
                    <Button type="button" variant="outline-danger" onClick={retry}>
                        Retry
                    </Button>
                </div>
            ) : recommendations.length === 0 ? (
                <p className="text-muted-foreground">
                    No suggestions yet. Make your first request.
                </p>
            ) : (
                <div className="grid gap-4">
                    {recommendations.map((recommendation, index) => {
                        const matchPercent = Math.min(
                            100,
                            Math.max(0, Number(recommendation.match_percent) || 0)
                        );

                        return (
                            <article
                                key={`${recommendation.document}-${index}`}
                                className="rounded-lg border bg-card p-5 shadow-sm"
                            >
                                    <div className="flex items-start gap-4">
                                        <span
                                            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm font-semibold text-primary-foreground"
                                            aria-label={`Rank ${index + 1}`}
                                        >
                                            #{index + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-start justify-between gap-4">
                                                <h3 className="mb-0 text-base font-semibold">
                                                    {recommendation.document}
                                                </h3>
                                                <span className="whitespace-nowrap font-semibold">
                                                    {matchPercent}% match
                                                </span>
                                            </div>
                                            <div
                                                className="h-2 overflow-hidden rounded-full bg-muted"
                                                role="progressbar"
                                                aria-valuenow={matchPercent}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-label={`${recommendation.document}: ${matchPercent}% match`}
                                            >
                                                <div
                                                    className="h-full w-[var(--progress-width)] rounded-full bg-primary"
                                                    style={{ "--progress-width": `${matchPercent}%` }}
                                                />
                                            </div>
                                            <p className="mb-6 mt-2 text-sm text-muted-foreground">
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
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default ForYouRecommendations;
