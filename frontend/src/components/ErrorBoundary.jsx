import { Component } from "react";
<<<<<<< HEAD
=======
import { ErrorContainer, ErrorDetails } from "./ErrorBoundary.styles";
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c

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
<<<<<<< HEAD
                <div style={{ padding: "20px", fontFamily: "monospace" }}>
                    <h2>Something went wrong</h2>
=======
                <ErrorContainer>
                    <h2>Something went wrong</h2>

>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
                    <p>
                        <strong>Error:</strong>{" "}
                        {this.state.error?.message || "Unknown error"}
                    </p>
<<<<<<< HEAD
                    <pre style={{ background: "#f5f5f5", padding: "10px", overflow: "auto" }}>
                        {this.state.error?.stack}
                    </pre>
                </div>
=======

                    <ErrorDetails>{this.state.error?.stack}</ErrorDetails>
                </ErrorContainer>
>>>>>>> becddf9375fcfe6dc053cacc68c3bef55ce4808c
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
