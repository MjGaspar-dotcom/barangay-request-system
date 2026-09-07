import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("React Error Boundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "20px", fontFamily: "monospace" }}>
                    <h2>Something went wrong</h2>
                    <p>
                        <strong>Error:</strong>{" "}
                        {this.state.error?.message || "Unknown error"}
                    </p>
                    <pre style={{ background: "#f5f5f5", padding: "10px", overflow: "auto" }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
