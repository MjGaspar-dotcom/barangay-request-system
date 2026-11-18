import {
    CircleAlert,
    CheckCircle2,
    Info,
    TriangleAlert,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import Button from "./Button";
import { ToastContext } from "./toast-context";
import {
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,
} from "./alert";
import "./toast.css";

let nextToastId = 0;

const statusIcons = {
    success: CheckCircle2,
    info: Info,
    warning: TriangleAlert,
    error: CircleAlert,
    rejected: CircleAlert,
};

const statusTitles = {
    success: "Success",
    info: "Request update",
    warning: "Attention",
    error: "Action failed",
    rejected: "Request rejected",
};

function ToastItem({ toast, dismissToast }) {
    const onDismissRef = useRef(toast.onDismiss);
    const Icon = statusIcons[toast.variant] || Info;
    useEffect(() => {
        onDismissRef.current = toast.onDismiss;
    }, [toast.onDismiss]);
    const dismiss = useCallback(() => {
        dismissToast(toast.id);
        onDismissRef.current?.();
    }, [dismissToast, toast.id]);

    useEffect(() => {
        if (toast.duration === null || toast.duration <= 0) return undefined;

        const remaining = Math.max(
            0,
            toast.createdAt + toast.duration - Date.now(),
        );
        const timer = window.setTimeout(dismiss, remaining);
        return () => window.clearTimeout(timer);
    }, [dismiss, toast.createdAt, toast.duration]);

    return (
        <Alert
            aria-live={toast.variant === "error" ? "assertive" : "polite"}
            className={`app-toast app-toast--${toast.variant}`}
            role={toast.variant === "error" ? "alert" : "status"}
            variant={
                ["error", "rejected"].includes(toast.variant)
                    ? "destructive"
                    : "default"
            }
        >
            <Icon aria-hidden="true" className="app-toast-icon" />
            <AlertTitle className="app-toast-title">
                {toast.title || statusTitles[toast.variant] || statusTitles.info}
            </AlertTitle>
            <AlertDescription className="app-toast-description">
                {toast.description}
            </AlertDescription>
            <button
                aria-label="Dismiss notification"
                className="app-toast-close"
                disabled={toast.dismissDisabled}
                onClick={dismiss}
                type="button"
            >
                <X aria-hidden="true" size={16} />
            </button>
            {toast.action && (
                <AlertAction className="app-toast-action">
                    <Button
                        className="app-button app-button-outline-secondary app-button-sm"
                        disabled={toast.action.disabled}
                        onClick={toast.action.onClick}
                        type="button"
                    >
                        {toast.action.label}
                    </Button>
                </AlertAction>
            )}
        </Alert>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const dismissToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);
    const showToast = useCallback((toast) => {
        const id = toast.id || `app-toast-${++nextToastId}`;
        const now = Date.now();
        setToasts((current) => {
            const previous = current.find((item) => item.id === id);
            const nextToast = {
                ...toast,
                id,
                createdAt:
                    toast.resetTimer || !previous
                        ? now
                        : previous.createdAt,
                duration:
                    toast.duration === undefined ? 7000 : toast.duration,
            };
            return [
                nextToast,
                ...current.filter((item) => item.id !== id),
            ];
        });
        return id;
    }, []);
    const value = useMemo(
        () => ({ dismissToast, showToast }),
        [dismissToast, showToast],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <section aria-label="Notifications" className="toast-viewport">
                {toasts.map((toast) => (
                    <ToastItem
                        dismissToast={dismissToast}
                        key={toast.id}
                        toast={toast}
                    />
                ))}
            </section>
        </ToastContext.Provider>
    );
}
