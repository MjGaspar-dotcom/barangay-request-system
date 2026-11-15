import { useEffect, useState } from "react";
import Button from "./ui/Button";
import api from "../services/api";

const CATEGORY_LABELS = {
    program: "Barangay program",
    service: "Service",
    announcement: "Announcement",
    activity: "Activity",
    government_assistance: "Government assistance",
};

function ageRange(item) {
    if (item.min_age == null && item.max_age == null) return null;
    if (item.min_age == null) return `Up to ${item.max_age} years`;
    if (item.max_age == null) return `${item.min_age}+ years`;
    return `${item.min_age}–${item.max_age} years`;
}

function ForYouRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [ageGroup, setAgeGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        const loadRecommendations = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await api.get("/recommendations", {
                    signal: controller.signal,
                });
                const data = response.data?.data;
                if (!Array.isArray(data?.recommendations)) {
                    throw new Error("Unexpected recommendations response.");
                }

                setRecommendations(data.recommendations);
                setAgeGroup(data.age_group || null);
            } catch (requestError) {
                if (controller.signal.aborted) return;
                console.error("Failed to load recommendations:", requestError);
                setError(
                    requestError.response?.data?.message ||
                        "Recommendations could not be loaded.",
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        loadRecommendations();
        return () => controller.abort();
    }, [retryCount]);

    const retry = () => setRetryCount((current) => current + 1);

    return (
        <section aria-labelledby="for-you-title">
            <header className="mb-6">
                <h2 id="for-you-title" className="mb-1 text-xl font-semibold">
                    For You
                </h2>
                <p className="mb-0 text-sm text-muted-foreground">
                    {ageGroup
                        ? `Programs and services for ${ageGroup}`
                        : "Programs and services selected for your profile"}
                </p>
            </header>

            {loading ? (
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
                    No current recommendations are available. Check back later.
                </p>
            ) : (
                <div className="grid gap-4">
                    {recommendations.map((recommendation) => (
                        <article
                            key={recommendation.id}
                            className="rounded-lg border bg-card p-5 shadow-sm"
                        >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    {CATEGORY_LABELS[recommendation.category] ||
                                        "Community update"}
                                </span>
                                {ageRange(recommendation) && (
                                    <span className="text-xs text-muted-foreground">
                                        Ages {ageRange(recommendation)}
                                    </span>
                                )}
                            </div>
                            <h3 className="mb-2 text-base font-semibold">
                                {recommendation.title}
                            </h3>
                            <p className="mb-0 text-sm text-muted-foreground">
                                {recommendation.description}
                            </p>
                            {recommendation.eligibility && (
                                <p className="mb-0 mt-3 text-sm">
                                    <strong>Eligibility:</strong>{" "}
                                    {recommendation.eligibility}
                                </p>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ForYouRecommendations;
