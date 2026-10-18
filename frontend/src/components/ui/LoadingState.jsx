import Spinner from "react-bootstrap/Spinner";
/** Props: label, className, size. Accessible shared loading indicator. */
export default function LoadingState({
    label = "Loading...",
    className = "",
    size = "sm",
}) {
    return (
        <div className={`loading-state ${className}`.trim()} role="status">
            <Spinner animation="border" size={size} aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}
