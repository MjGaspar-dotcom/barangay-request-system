import { Component } from "react";
import { ErrorContainer, ErrorDetails } from "./ErrorBoundary.styles";

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
                <ErrorContainer>
                    <h2>Something went wrong</h2>

                    <p>
                        <strong>Error:</strong>{" "}
                        {this.state.error?.message || "Unknown error"}
                    </p>

                    <ErrorDetails>{this.state.error?.stack}</ErrorDetails>
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
