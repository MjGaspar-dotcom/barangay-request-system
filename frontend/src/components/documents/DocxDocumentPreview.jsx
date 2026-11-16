import { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

export default function DocxDocumentPreview({ source }) {
    const containerRef = useRef(null);
    const [result, setResult] = useState(null);
    const currentResult = result?.source === source ? result : null;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !source) return undefined;

        let active = true;
        container.replaceChildren();

        const renderDocument = async () => {
            try {
                let documentData = source;
                if (
                    typeof source === "string" ||
                    source instanceof URL
                ) {
                    const response = await fetch(source);
                    if (!response.ok) {
                        throw new Error(
                            `Unable to load DOCX preview (${response.status}).`,
                        );
                    }
                    documentData = await response.blob();
                }

                await renderAsync(documentData, container, container, {
                    useBase64URL: true,
                });
                if (active) {
                    setResult({ source, status: "ready" });
                }
            } catch (renderError) {
                console.error(renderError);
                if (active) {
                    container.replaceChildren();
                    setResult({ source, status: "error" });
                }
            }
        };

        renderDocument();

        return () => {
            active = false;
            container.replaceChildren();
        };
    }, [source]);

    return (
        <div className="document-template-docx-preview">
            {currentResult?.status === "error" ? (
                <p className="app-alert app-alert-danger" role="alert">
                    This Word document could not be previewed. Check that it is
                    a valid DOCX file.
                </p>
            ) : !currentResult ? (
                <p className="document-template-muted" role="status">
                    Rendering Word document preview…
                </p>
            ) : null}
            <div aria-label="DOCX document preview" ref={containerRef} />
        </div>
    );
}
