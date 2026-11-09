import BrandMark from "./BrandMark";

export default function LoadingState({
    label = "Loading...",
    className = "",
}) {
    const showLogo = className.split(/\s+/).includes("logo-loading");

    return (
        <div
            className={`loading-state ${className}`.trim()}
            role="status"
            aria-label={label}
        >
            {showLogo ? (
                <BrandMark className="loading-state-logo" alt="" />
            ) : (
                <div className="loading-state-generic-skeleton" aria-hidden="true">
                    <div />
                    <div />
                    <div />
                    <div />
                </div>
            )}
            <span className="visually-hidden">{label}</span>
        </div>
    );
}
