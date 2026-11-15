import { useEffect, useRef } from "react";

export default function useLiveRefresh(callback, interval = 5000) {
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        let refreshing = false;

        const refresh = async () => {
            if (document.visibilityState !== "visible" || refreshing) return;

            refreshing = true;
            try {
                await callbackRef.current();
            } finally {
                refreshing = false;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") refresh();
        };

        const timer = window.setInterval(refresh, interval);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [interval]);
}
