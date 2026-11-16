import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const clamp = (value, minimum, maximum) =>
    Math.min(maximum, Math.max(minimum, value));

const resolvePdfSource = async (source) => {
    if (!source) {
        return null;
    }

    if (source instanceof Blob) {
        return { data: new Uint8Array(await source.arrayBuffer()) };
    }

    if (source instanceof ArrayBuffer) {
        return { data: new Uint8Array(source) };
    }

    if (ArrayBuffer.isView(source)) {
        return { data: source };
    }

    if (typeof source === "string") {
        if (source.startsWith("blob:") || source.startsWith("data:")) {
            const response = await fetch(source);
            if (!response.ok) {
                throw new Error(`Unable to fetch PDF source (${response.status}).`);
            }
            return { data: new Uint8Array(await response.arrayBuffer()) };
        }

        return { data: source };
    }

    return { data: source };
};

export default function PdfDocumentCanvas({
    source,
    fields = [],
    selectedFieldName,
    editable = false,
    onSelectField,
    onChangeField,
}) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const scrollRef = useRef(null);
    const dragRef = useRef(null);
    const [pdfDocument, setPdfDocument] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [pageInfo, setPageInfo] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || typeof ResizeObserver === "undefined") return undefined;

        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!source) return undefined;

        let cancelled = false;
        let loadingTask;

        const loadDocument = async () => {
            try {
                const resolvedSource = await resolvePdfSource(source);
                loadingTask = getDocument(resolvedSource);
                const document = await loadingTask.promise;
                if (cancelled) {
                    document.destroy();
                    return;
                }
                setError("");
                setPdfDocument(document);
                setPageCount(document.numPages);
            } catch (loadError) {
                if (!cancelled) {
                    console.error(loadError);
                    setError("The PDF preview could not be loaded.");
                    setPdfDocument(null);
                    setPageCount(0);
                }
            }
        };

        loadDocument();

        return () => {
            cancelled = true;
            loadingTask?.destroy();
        };
    }, [source]);

    useEffect(() => {
        if (!pdfDocument || !canvasRef.current || pageCount === 0) {
            return undefined;
        }

        let cancelled = false;
        let renderTask;
        let pageProxy;

        pdfDocument
            .getPage(pageNumber)
            .then((page) => {
                if (cancelled) return;
                pageProxy = page;
                const baseViewport = page.getViewport({ scale: 1 });
                const availableWidth = Math.max(
                    containerWidth ? containerWidth - 32 : 900,
                    320,
                );
                const scale = Math.min(1.25, availableWidth / baseViewport.width);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;
                setPageInfo({
                    viewport,
                    scale,
                    width: viewport.width,
                    height: viewport.height,
                    viewBox: page.view,
                });
                renderTask = page.render({
                    canvasContext: canvas.getContext("2d"),
                    viewport,
                });
                return renderTask.promise;
            })
            .catch((renderError) => {
                if (!cancelled && renderError?.name !== "RenderingCancelledException") {
                    console.error(renderError);
                    setError("The selected PDF page could not be rendered.");
                }
            });

        return () => {
            cancelled = true;
            renderTask?.cancel();
            pageProxy?.cleanup();
        };
    }, [containerWidth, pageCount, pageNumber, pdfDocument]);

    const currentFields = fields.filter(
        (field) =>
            field.field_type === "overlay" &&
            Number(field.page_number) === pageNumber,
    );

    const fieldViewportRect = (field) => {
        if (!pageInfo) return {};
        const [, , pageRight, pageTop] = pageInfo.viewBox;
        const pageLeft = pageInfo.viewBox[0];
        const pageBottom = pageInfo.viewBox[1];
        const pageWidth = pageRight - pageLeft;
        const pageHeight = pageTop - pageBottom;
        const left = pageLeft + Number(field.x) * pageWidth;
        const bottom = pageBottom + Number(field.y) * pageHeight;
        const right = left + Number(field.width) * pageWidth;
        const top = bottom + Number(field.height) * pageHeight;
        const corners = [
            pageInfo.viewport.convertToViewportPoint(left, bottom),
            pageInfo.viewport.convertToViewportPoint(left, top),
            pageInfo.viewport.convertToViewportPoint(right, bottom),
            pageInfo.viewport.convertToViewportPoint(right, top),
        ];
        const xs = corners.map(([x]) => x);
        const ys = corners.map(([, y]) => y);
        const fieldLeft = Math.min(...xs);
        const fieldTop = Math.min(...ys);

        return {
            left: fieldLeft,
            top: fieldTop,
            width: Math.max(...xs) - fieldLeft,
            height: Math.max(...ys) - fieldTop,
        };
    };

    const fieldStyle = (field) => {
        if (!pageInfo) return {};
        const rect = fieldViewportRect(field);
        return {
            left: `${(rect.left / pageInfo.width) * 100}%`,
            top: `${(rect.top / pageInfo.height) * 100}%`,
            width: `${(rect.width / pageInfo.width) * 100}%`,
            height: `${(rect.height / pageInfo.height) * 100}%`,
            fontSize: `${Number(field.font_size || 12) * pageInfo.scale}px`,
            textAlign: field.text_align || "left",
        };
    };

    const pointerPosition = (event) => {
        if (!pageInfo || !overlayRef.current) return null;
        const rect = overlayRef.current.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * pageInfo.width;
        const y = ((event.clientY - rect.top) / rect.height) * pageInfo.height;
        return pageInfo.viewport.convertToPdfPoint(x, y);
    };

    const startDrag = (event, field, action) => {
        if (!editable || !pageInfo) return;
        event.preventDefault();
        event.stopPropagation();
        const point = pointerPosition(event);
        if (!point) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            field,
            action,
            startPoint: point,
            anchorPoint: action === "resize"
                ? pageInfo.viewport.convertToPdfPoint(
                    fieldViewportRect(field).left,
                    fieldViewportRect(field).top,
                )
                : null,
            original: { ...field },
        };
        onSelectField?.(field.field_name);
    };

    const moveField = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || !pageInfo) return;
        const point = pointerPosition(event);
        if (!point) return;

        const pageWidth = pageInfo.viewBox[2] - pageInfo.viewBox[0];
        const pageHeight = pageInfo.viewBox[3] - pageInfo.viewBox[1];
        const deltaX = (point[0] - drag.startPoint[0]) / pageWidth;
        const deltaY = (point[1] - drag.startPoint[1]) / pageHeight;
        const original = drag.original;
        let updated;

        if (drag.action === "resize") {
            const anchor = drag.anchorPoint;
            const left = Math.min(anchor[0], point[0]);
            const right = Math.max(anchor[0], point[0]);
            const bottom = Math.min(anchor[1], point[1]);
            const top = Math.max(anchor[1], point[1]);
            const viewLeft = pageInfo.viewBox[0];
            const viewBottom = pageInfo.viewBox[1];
            updated = {
                ...original,
                x: clamp((left - viewLeft) / pageWidth, 0, 0.97),
                y: clamp((bottom - viewBottom) / pageHeight, 0, 0.98),
                width: clamp((right - left) / pageWidth, 0.03, 1),
                height: clamp((top - bottom) / pageHeight, 0.02, 1),
            };
            updated.width = Math.min(updated.width, 1 - updated.x);
            updated.height = Math.min(updated.height, 1 - updated.y);
        } else {
            updated = {
                ...original,
                x: clamp(Number(original.x) + deltaX, 0, 1 - original.width),
                y: clamp(Number(original.y) + deltaY, 0, 1 - original.height),
            };
        }
        onChangeField?.(updated);
    };

    const finishDrag = (event) => {
        if (dragRef.current?.pointerId === event.pointerId) {
            dragRef.current = null;
        }
    };

    if (!source) {
        return <p className="document-template-empty-preview">Choose a PDF to preview it.</p>;
    }

    return (
        <div className="pdf-canvas-viewer">
            {error && (
                <div className="app-alert app-alert-danger" role="alert">
                    {error}
                </div>
            )}
            {pageCount > 1 && (
                <div className="pdf-canvas-toolbar">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((value) => value - 1)}
                        type="button"
                    >
                        Previous page
                    </button>
                    <span>
                        Page {pageNumber} of {pageCount}
                    </span>
                    <button
                        disabled={pageNumber >= pageCount}
                        onClick={() => setPageNumber((value) => value + 1)}
                        type="button"
                    >
                        Next page
                    </button>
                </div>
            )}
            <div className="pdf-canvas-scroll" ref={scrollRef}>
                <div className="pdf-canvas-page">
                    <canvas aria-label={`PDF page ${pageNumber}`} ref={canvasRef} />
                    <div
                        className={`pdf-canvas-overlay ${editable ? "is-editable" : ""}`}
                        onPointerMove={moveField}
                        onPointerUp={finishDrag}
                        ref={overlayRef}
                        style={{
                            width: pageInfo ? `${pageInfo.width}px` : undefined,
                            height: pageInfo ? `${pageInfo.height}px` : undefined,
                        }}
                    >
                        {currentFields.map((field) => (
                            <div
                                aria-label={`${field.field_name} mapped PDF field`}
                                className={`pdf-mapped-field ${
                                    field.field_name === selectedFieldName
                                        ? "is-selected"
                                        : ""
                                }`}
                                key={field.field_name}
                                onClick={() => onSelectField?.(field.field_name)}
                                onPointerDown={(event) =>
                                    startDrag(event, field, "move")
                                }
                                style={fieldStyle(field)}
                            >
                                <span className="pdf-mapped-field-label">
                                    {field.system_field || field.field_name}
                                </span>
                                {editable &&
                                    field.field_name === selectedFieldName && (
                                        <button
                                            aria-label="Resize mapped field"
                                            className="pdf-mapped-field-resize"
                                            onPointerDown={(event) =>
                                                startDrag(event, field, "resize")
                                            }
                                            type="button"
                                        />
                                    )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
